import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true },
  mascot: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

teamSchema.pre('save', function (next) {
  if (!Array.isArray(this.members)) {
    this.members = [];
  }
  next();
});

export const Team = model('Team', teamSchema);
