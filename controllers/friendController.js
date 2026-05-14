const User = require("../models/User");

// SEND REQUEST
const sendRequest = async (req, res) => {
    try {
        const { userId, friendId, username } = req.body;

        const user = await User.findById(userId);
        const friend = friendId
            ? await User.findById(friendId)
            : await User.findOne({ username });

        if (!user) return res.status(400).json({ message: "User not found" });
        if (!friend) return res.status(400).json({ message: "Friend not found" });
        if (friend._id.toString() === userId) {
            return res.status(400).json({ message: "You cannot add yourself" });
        }

        const alreadyFriends = user.friends.some(id => id.toString() === friend._id.toString());
        const alreadyRequested = friend.friendRequests.some(id => id.toString() === userId);

        if (alreadyFriends) return res.status(400).json({ message: "Already friends" });
        if (alreadyRequested) return res.status(400).json({ message: "Request already sent" });

        friend.friendRequests.push(userId);
        await friend.save();

        res.json({ message: "Request sent", friend: publicUser(friend) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ACCEPT REQUEST
const acceptRequest = async (req, res) => {
    try {
        const { userId, friendId, requestId } = req.body;
        const requesterId = friendId || requestId;

        const user = await User.findById(userId);
        const friend = await User.findById(requesterId);

        if (!user || !friend) {
            return res.status(400).json({ message: "Invalid data" });
        }

        const hasRequest = user.friendRequests.some(
            id => id.toString() === requesterId
        );

        if (!hasRequest) {
            return res.status(400).json({ message: "No request from this user" });
        }

        if (!user.friends.some(id => id.toString() === requesterId)) {
            user.friends.push(requesterId);
        }

        if (!friend.friends.some(id => id.toString() === userId)) {
            friend.friends.push(userId);
        }

        user.friendRequests = user.friendRequests.filter(
            id => id.toString() !== requesterId
        );

        await user.save();
        await friend.save();

        res.json({ message: "Friend added", friend: publicUser(friend) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate("friends", "username xp level")
            .populate("friendRequests", "username xp level");

        if (!user) return res.status(400).json({ message: "User not found" });

        res.json({
            friends: user.friends.map(publicUser),
            friendRequests: user.friendRequests.map(publicUser)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

function publicUser(user) {
    return {
        _id: user._id,
        username: user.username,
        xp: user.xp,
        level: user.level
    };
}

module.exports = { sendRequest, acceptRequest, getFriends };
