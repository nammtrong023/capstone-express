import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { createToken } from '../config/jwt.js';
import { getCurrentUserId } from '../utils/get-current-user-id.js';

const signUp = async (req, res) => {
    const { name, email, age, password } = req.body;

    if (!name || !email || !password || !age) {
        return res.send('Vui lòng nhập đủ name, email, password, age');
    }

    const isExistingEmail = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (isExistingEmail) {
        return res.send('Email đã tồn tại');
    }

    const hashPassword = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            age,
            password: hashPassword,
        },
    });

    return res.status(201).json(user);
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Vui lòng nhập email và password');
    }

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        return res.status(400).send('Email hoặc password không đúng');
    }

    const isMatchesPassword = bcrypt.compareSync(password, user.password);

    if (isMatchesPassword) {
        let token = createToken({ data: user });

        return res.send(token);
    } else {
        return res.send('Password không đúng');
    }
};

const getUsers = async (req, res) => {
    const users = await prisma.user.findMany();

    if (!users) {
        return res.status(404).send('Không tìm thấy users');
    }

    return res.status(200).json(users);
};

const getUserByImageId = async (req, res) => {
    const { imageId, userId } = req.params;

    if (!imageId || !userId) {
        return res.status(404).send('Vui lòng nhập imageId và userId');
    }

    const user = await prisma.user.findUnique({
        where: {
            id: Number(userId),
        },
        include: {
            images: {
                where: {
                    id: Number(imageId),
                },
            },
        },
    });

    if (!user) {
        return res.status(404).send('Không tìm thấy user');
    }

    return res.status(200).send(user);
};

const updateUserProfile = async (req, res) => {
    const { token } = req.headers;
    const { name, age } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('File không hợp lệ');
    }

    if (!name || !age) {
        return res.status(400).send('Vui lòng nhập name và age');
    }

    const currentUserId = await getCurrentUserId(token);

    const currentUser = await prisma.user.update({
        where: {
            id: currentUserId,
        },
        data: {
            name,
            age: parseInt(age),
            userAvatar: file.originalname,
        },
    });

    return res.status(200).json(currentUser);
};

export { login, signUp, getUsers, getUserByImageId, updateUserProfile };
