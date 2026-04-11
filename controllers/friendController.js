const User = require("../models/User");

// SEND REQUEST
const sendRequest = async (req, res) => {
    const { userId, friendId } = req.body;

    const friend = await User.findById(friendId);

    if (!friend) return res.status(400).json({ message: "User not found" });

    friend.friendRequests.push(userId);
    await friend.save();

    res.json({ message: "Request sent" });
};

// ACCEPT REQUEST
const acceptRequest = async (req, res) => {
    const { userId, friendId } = req.body;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    user.friends.push(friendId);
    friend.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(
        id => id.toString() !== friendId
    );

    await user.save();
    await friend.save();

    res.json({ message: "Friend added" });
};

module.exports = { sendRequest, acceptRequest };
