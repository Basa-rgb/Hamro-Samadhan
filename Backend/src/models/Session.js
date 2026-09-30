const mongoose = require("mongoose");
const crypto = require("crypto");

// Server-side session, so a logout really kills the token
// A JWT cannot be revoked, so a stolen token stayed usable until it expired
const SessionSchema = new mongoose.Schema(
  {
    // Only the hash is stored, so a database leak cannot be replayed as a login
    // SHA-256 is enough here, the token is already 32 random bytes
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Short life, a leaked session is useless after a quarter of an hour
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Mongo removes the row once it expires, so dead sessions never pile up
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hands back the raw token to the client and keeps only its hash on record
SessionSchema.statics.createForUser = async function (userId) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await this.create({
    tokenHash: this.hashToken(rawToken),
    user: userId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  return rawToken;
};

// Same hash used on the way in, so a token is only ever compared like for like
SessionSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

// Looks a session up by the raw token the client sent
// Deliberately not async, a Mongoose Query is a thenable, so an async wrapper
// would resolve it to a plain document and callers could no longer chain
// .populate() onto it
SessionSchema.statics.findValid = function (rawToken) {
  if (!rawToken) {
    return null;
  }

  return this.findOne({
    tokenHash: this.hashToken(rawToken),
    expiresAt: { $gt: new Date() },
  });
};

// Ends a session, which is what makes logout real rather than cosmetic
SessionSchema.statics.revoke = async function (rawToken) {
  if (!rawToken) {
    return;
  }

  await this.deleteOne({ tokenHash: this.hashToken(rawToken) });
};

module.exports = mongoose.model("Session", SessionSchema);
