const {Schema, model} = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    profileImage: String,
    bio: {
        type: String,
        maxlength: 200,
    },
    profession: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
  });

//   hash password with bcrypt
userSchema.pre('save', async function(next){
    const user = this;
    if(!user.isNew && !user.isModified('password')) return next();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    next();
});

//   compare password
userSchema.methods.comparePassword = function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password);
}

  const User = new model('User', userSchema);
  module.exports = User;