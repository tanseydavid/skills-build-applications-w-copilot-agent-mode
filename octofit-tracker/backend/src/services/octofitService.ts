import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  const activities = await Activity.find().lean();
  return activities.map((act) => ({
    ...act,
    user: act.user?.toString?.() || act.user,
    team: act.team?.toString?.() || act.team,
  }));
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = Object.assign(new Error('Invalid activity input'), { status: 400 });
    throw error;
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || !type || minutes === undefined) {
    const error = Object.assign(new Error('Missing required fields: userId, teamId, type, minutes'), { status: 400 });
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(userId as string) || !mongoose.Types.ObjectId.isValid(teamId as string)) {
    const error = Object.assign(new Error('Invalid user or team ID'), { status: 400 });
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = Object.assign(new Error('User not found'), { status: 404 });
    throw error;
  }

  const team = await Team.findById(teamId);
  if (!team) {
    const error = Object.assign(new Error('Team not found'), { status: 404 });
    throw error;
  }

  const points = typeof minutes === 'number' ? minutes : 0;
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  const doc = activity.toObject();
  return {
    ...doc,
    user: doc.user.toString(),
    team: doc.team.toString(),
  };
}

export async function listTeams() {
  const teams = await Team.find().lean();
  return teams.map((team) => ({
    ...team,
    members: (team.members || []).map((m) => m.toString?.() || m),
  }));
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = Object.assign(new Error('Invalid team input'), { status: 400 });
    throw error;
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (!name) {
    const error = Object.assign(new Error('Team name is required'), { status: 400 });
    throw error;
  }

  if (!mascot) {
    const error = Object.assign(new Error('Team mascot is required'), { status: 400 });
    throw error;
  }

  const membersList = Array.isArray(members)
    ? members.filter((m) => typeof m === 'string' && mongoose.Types.ObjectId.isValid(m))
    : [];

  const team = await Team.create({
    name,
    mascot,
    members: membersList,
  });

  const doc = team.toObject();
  return {
    ...doc,
    members: (doc.members || []).map((m) => m.toString?.() || m),
  };
}

export async function getLeaderboard() {
  const teamStats = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  const leaderboard = teamStats.map((item, index) => ({
    teamName: item.teamData.name,
    totalPoints: item.totalPoints,
    rank: index + 1,
  }));

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const decodedEmail = decodeURIComponent(userEmail);

  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    const error = Object.assign(new Error('User not found'), { status: 404 });
    throw error;
  }

  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5);

  let focus = user.fitnessGoal || 'endurance';
  let reason = `Matching your fitness goal: ${focus}`;

  if (activities.length > 0) {
    const typeCounts = activities.reduce(
      (acc, act) => {
        acc[act.type] = (acc[act.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostCommon = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
    if (mostCommon) {
      const focusMap: Record<string, string> = {
        run: 'endurance',
        cycle: 'endurance',
        walk: 'cardio',
        strength: 'strength',
        swim: 'cardio',
      };
      focus = focusMap[mostCommon] || focus;
      reason = `Based on your recent ${mostCommon} activities`;
    }
  }

  let suggestions = await Workout.find({ focus }).lean();

  if (suggestions.length === 0) {
    suggestions = await Workout.find().limit(1).lean();
  }

  return suggestions.map((w) => ({ ...w, reason }));
}

export { User };
