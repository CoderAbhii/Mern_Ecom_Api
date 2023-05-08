const crypto = require("crypto");
const User = require('../models/userModel');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const errorHandler = require("../utils/errorHandler");


/**
 * @DESC Create A User Controller
 */
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const checkEmail = await User.findOne({email});
        if (checkEmail) {
            return res.status(400).json({
                success: false,
                message: "User already exist with this email"
            });
        }
        const user = await User.create({
            name, email, password, avatar: { public_id: "this is sample id", url: "profileurl" },
        });
        sendToken(user, 201, res);
    } catch (error) {
        errorHandler("Error Detect In Create-User Controller \n", error, res);
    }
}

/**
 * @DESC Login A User Controller
 */
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credential"
            });
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid credential"
            });
        }
        sendToken(user, 200, res);
    } catch (error) {
        errorHandler("Error Detect In Login-User Controller \n", error, res);
    }
}

/**
 * @DESC Logout A User Controller
 */
exports.logoutUser = async (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })
        res.status(200).json({
            success: true,
            message: "Logout successfully"
        })
    } catch (error) {
        errorHandler("Error Detect In Logout-User Controller \n", error, res);
    }
}

/**
 * @DESC Forgot Password Controller
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetPasswordUrl = `http://localhost:6550/api/v1/auth/password/reset/${resetToken}`;

        const message = `Your password reset link is: \n\n ${resetPasswordUrl} \n\n If it was not request by you pls don't share this and ignore this message.`;

        try {
            await sendEmail({
                email: user.email,
                subject: `StackQuiz Password Recovery`,
                message
            });
            res.status(200).json({
                success: true,
                message: `We have sent you a password reset email in ${user.email} successfully`
            })
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("Forgot Password Error", error.message);
            errorHandler("Error Detect In Forgot Password Controller (email) \n", error, res);
        }
    } catch (error) {
        errorHandler("Error Detect In Forgot Password Controller \n", error, res);
    }
}

/**
 * @DESC Reset Password Controller
 */
exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Your password reset link is expired. Try again"
            });
        }
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password doesn't matched"
            });
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        sendToken(user, 200, res);

    } catch (error) {
        errorHandler("Error Detect In Reset Password Controller \n", error, res);
    }
}

/**
 * @DESC Get User Details Controller
 */
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        errorHandler("Error Detect In Get User Details Controller \n", error, res);
    }
}

/**
 * @DESC Update User Password Controller
 */
exports.updateUserPassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("+password");

        const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
        if (!isPasswordMatched) {
            return res.status(400).json({
                success: false,
                message: "Old password not verified"
            });
        }
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password doesn't matched"
            });
        }
        user.password = req.body.newPassword;
        await user.save();
        sendToken(user, 200, res);

    } catch (error) {
        errorHandler("Error Detect In Update User Password Controller \n", error, res);
    }
}

/**
 * @DESC Update User Profile Controller
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
        }
        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        errorHandler("Error Detect In Update User Profile Controller \n", error, res);
    }
}

/**
 * @DESC Check All Users Controller || <{Admin Access Route}>
 */
exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await User.find();
        res.status(200).json({
            success: true,
            allUsers
        });
    } catch (error) {
        errorHandler("Error Detect In Get All Users Controller \n", error, res);
    }
}

/**
 * @DESC Check Particular Users Profile Controller || <{Admin Access Route}>
 */
exports.getSingleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        errorHandler("Error Detect In Get Single User Controller \n", error, res);
    }
}

/**
 * @DESC Update Any User Profile Controller || <{Admin Access Route}>
 */
exports.updateUser = async(req, res) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
        }
        const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        errorHandler("Error Detect In Update Single User Controller \n", error, res);
    }
}

/**
 * @DESC Delete User Controller || <{Admin Access Route}>
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        errorHandler("Error Detect In Delete Users Controller \n", error, res);
    }
}