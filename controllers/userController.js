import userModel from "../models/userSchema.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const saltRounds = 10
import getRandomFruitsName from "random-fruits-name"
import nodemailer from 'nodemailer'
let createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET)
}

export async function login(req, res) {
  let { email, password } = req.body;
  try {
    let data_array = await userModel.find({});
    if (!data_array) {
      return res.status(500).json({ error: "Some error occurred" });
    }
    let validUser = false;
    for (let i = 0; i < data_array.length; i++) {
      if (bcrypt.compareSync(email, data_array[i].email)) {
        let pass = bcrypt.compareSync(password, data_array[i].password);
        if (pass) {
          validUser = true;
          let token = createToken(data_array[i]._id);
          res.status(200).json({
            email,
            token,
            error: { email: true, password: true },
          });
          break;
        } else {
          res.json({ error: { email: true, password: false } });
          return;
        }
      }
    }
    if (!validUser) {
      res.json({ error: { email: false, password: false } });
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ status: e.message });
  }
}

export async function register(req, res) {
  let { email, password } = req.body;
  try {
    let data_array = await userModel.find({})
    if (!data_array) {
      return res.status(500).json({ error: "Some error occurred" });
    }
    let validUser = false;
    for (let i = 0; i < data_array.length; i++) {
      if (bcrypt.compareSync(email, data_array[i].email)) {
        validUser = true;
        res.json({ error: true })
        break;
      }
      else {
        validUser = false;
      }
    }
    if (!validUser) {
      const username = getRandomFruitsName()
      let mail = bcrypt.hashSync(email, saltRounds)
      let pass = bcrypt.hashSync(password, saltRounds)
      let user = new userModel({
        email: mail,
        password: pass,
        username: username,
      })
      await user.save()
      let token = createToken(user._id)
      res.status(200).json({ email, token, error: false })
    }
    else {
      res.json({ error: true })
    }
  }
  catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export async function otpGenerate(req, res) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const trasport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS
    }
  });
  const mailOptios = {
    from: process.env.EMAIL,
    to: req.body.email,
    subject: `OTP for Email Verification is: ${otp}`,
    html: `<h1>Your OTP is: ${otp}</h1>`
  }
  trasport.sendMail(mailOptios, (error, info) => {
    if (error) {
      res.status(400).json({ status: 400, error: error })
    } else {
      console.log("Email sent " + info.response);
      res.status(200).json({ status: 200, info, otp: otp })
    }
  })
}