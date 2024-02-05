const Follow = require("../models/follow");

const followUserIds = async (identityUserId) => {
  try {

    // Sacar info seguimiento
    let following = await Follow.find({ user: identityUserId }).select({
        //   _id: 0,
        //   __v: 0,
        //   user: 0,
        "followed" : 1,
        "_id":0
    });
   
    let followers = await Follow.find({ followed: identityUserId }).select({
        "user" : 1,
        "_id":0
    });
    
    // Porcesar array de identificadores
    let followingClean = []

    following.forEach(follow => {
        followingClean.push(follow.followed)
    })

    let followersClean = []

    followers.forEach(follow => {
        followersClean.push(follow.user)
    })

    return {
      following: followingClean,
      followers: followersClean
    };
  } catch (error) {

    return {}

  }
};

const followThisUser = async (identityUserId, profileUserId) => {

    let following = await Follow.findOne({ user: identityUserId, followed:profileUserId }).select(
    {
        //   _id: 0,
        //   __v: 0,
        //   user: 0,
        // "followed" : 1,
        // "_id":0
    });
   
    let follower = await Follow.findOne({ user: profileUserId, followed: identityUserId }).select(
    {
        // "user" : 1,
        // "_id":0
    });

    return  {
        following,
        follower
    }

};

module.exports = {
  followUserIds,
  followThisUser,
};
