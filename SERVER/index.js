import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "cookie-session";
import env from "dotenv";
import db from "./db.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import authRouter, { tokenExport, user_data_google } from "./oAuth.js";
import requestRouter from "./request.js";

const app = express();
const port = process.env.PORT;
const saltRounds = 10;
const secret = process.env.SESSION_SECRET;
env.config();
// db.connect();

app.use(
	cors({
		origin: "https://safezen.in",
		methods: ["POST", "GET"],
		credentials: true,
	})
);
app.use(express.json()); //req.body
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	session({
		key: "userID",
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true, //  D  -  O  -  U  -  B  -  T
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			// httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JavaScript
			// secure: process.env.NODE_ENV === "production", // Ensures the cookie is sent only over HTTPS
			secure: true,
		},
	})
);

app.use(function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "https://safezen.in");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers");
	next();
});

app.use(function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "https://www.safezen.in");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers");
	next();
});

app.use("/oauth", authRouter);
app.use("/request", requestRouter);
// app.use("/htmlAuth", htmlRouter);

const verifyUser = (req, res, next) => {
	const token = req.cookies.token;
	if (!token) return res.json({ Error: "You need to sign in" });
	else {
		jwt.verify(token, secret, (err, decoded) => {
			if (err) return res.json({ Error: "Token is not same" });
			else {
				req.email = decoded.email;
				next();
			}
		});
	}
};

app.post("/verifyToken", (req, res) => {
	let token = req.body;
	token = token.token;
	let tokenImported = tokenExport;
	token = JSON.stringify(token);
	tokenImported = JSON.stringify(tokenImported);
	if (token === tokenImported) {
		let email_user = user_data_google.email;
		res.json({ Status: "Success", email: email_user });
	} else {
		// console.log("Alag hai tokens");
		res.json({ Status: "Error", Error: "Invalid Token" });
	}
});

app.get("/", verifyUser, (req, res) => {
	res.send({ Status: "Success", email: req.email });
});

app.get("/test", (req, res) => {
	res.send("Server Working");
});

app.get("/logout", (req, res) => {
	res.clearCookie("token");
	return res.json({ Status: "Success" });
});

app.get("/IndTherapy", (req, res) => {
	try {
		const sql = "SELECT * FROM indtherapy";
		db.query(sql, (err, data) => {
			if (err) return res.json(err);
			return res.json(data);
		});
	} catch (err) {
		console.error(err.message);
	}
});

app.get("/test", (req, res) => {
	res.send("Server Working");
});

app.get("/RelTherapy", (req, res) => {
	try {
		const sql = "SELECT * FROM reltherapy";
		db.query(sql, (err, data) => {
			if (err) return res.json(err);
			return res.json(data);
		});
	} catch (err) {
		console.error(err.message);
	}
});

app.get("/doctorsData", (req, res) => {
	try {
		const sql = "SELECT * FROM doctor_data";
		db.query(sql, (err, data) => {
			if (err) return res.json(err);
			console.log(data);
			return res.json(data);
		});
	} catch (err) {
		console.error(err.message);
	}
});

app.post("/login", (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	try {
		db.query("SELECT * FROM user_data WHERE emailID = ? ", [email], (err, result) => {
			if (err) return res.json({ Error: "Error" });
			else if (result.length > 0) {
				const user = result[0];
				const storedHashedPassword = user.Password;
				bcrypt.compare(password, storedHashedPassword, (err, valid) => {
					if (err) {
						return res.json({ Error: "Error Comparing Password" });
					} else {
						if (valid) {
							const token = jwt.sign({ email }, secret, { expiresIn: '7d' });
							res.cookie("token", token, { maxAge: 7 * 24 * 60 * 60 * 1000 });
							return res.json({ Status: "Success" });
						} else {
							return res.json({ Error: "Passwors do no match" });
						}
					}
				});
			} else {
				return res.json({ Error: "User Not Found" });
			}
		});
	} catch (err) {
		return res.json({ Error: "Error" });
	}
});
app.post("/signup", (req, res) => {
	console.log("hi");
	const email = req.body.email;
	const password = req.body.password;
	const age = req.body.age;
	try {
		db.query("SELECT * FROM user_data WHERE emailId = ?", [email], (err, checkResult) => {
			if (err) return res.json({ Error: "Error" });
			else if (checkResult.length > 0) {
				return res.json({ Error: "User already Exist" });
			} else {
				bcrypt.hash(password, saltRounds, (err, hash) => {
					if (err) {
						return res.json({ Error: "Error Hashing Password" });
					} else {
						try {
							db.query(
								"INSERT INTO user_data (emailId, Password, age, noOfSessions) VALUES (?, ?, ?, ?)",
								[email, hash, age, 0],
								(err, result) => {
									if (err) return res.json({ Error: "Error L154" });
									else {
										const user = result[0];
										return res.json({ Status: "Success" });
									}
								}
							);
						} catch (err) {
							return res.json({ Error: "Error inserting data in database" });
						}
					}
				});
			}
		});
	} catch (err) {
		console.log({ Error: "Error" });
	}
});

app.post("/book-appointment", (req, res) => {
	console.log("hi");
	const email = req.body.email;
	const date = req.body.date;
	const timeSlot = req.body.timeSlot;
	const therapy = req.body.therapy;
	const illness = req.body.illness;
	const description = req.body.description;
	try {
		db.query("SELECT * FROM user_data WHERE emailId = ?", [email], (err, checkResult) => {
			if (err) return res.json({ Error: "Error" });
			else if (checkResult.length === 0) {
				return res.json({ Error: "User not found" });
			} else {
				if(therapy === "Individual Therapy")
				{
					db.query("SELECT illness_id FROM indtherapy WHERE illness_name = ?", [illness], (err, answer) => {
						try {
							db.query(
								"INSERT INTO indappointments (description, user_id, illness_id, date, timeSlot) VALUES (?, ?, ?, ?, ?)",
								[description, checkResult[0].userId, answer[0].illness_id, date, timeSlot],
								(err, result) => {
									console.log(description,checkResult[0].userId, answer[0].illness_id, date, timeSlot);
									if (err) return res.json({ Error: "Error storing appointment data in SERVER" });
									else {
										return res.json({ Status: "Success" });
									}
								}
							);
						} catch (err) {
							return res.json({ Error: "Error inserting data in database" });
						}
					});
				}
				else{
					db.query("SELECT relillness_id FROM reltherapy WHERE relillness_name = ?", [illness], (err, answer) => {
						try {
							db.query(
								"INSERT INTO relappointments (description, user_id, relillness_id, date, timeSlot) VALUES (?, ?, ?, ?, ?)",
								[description, checkResult[0].userId, answer[0].relillness_id, date, timeSlot],
								(err, result) => {
									if (err) return res.json({ Error: "Error storing appointment data in SERVER" });
									else {
										return res.json({ Status: "Success" });
									}
								}
							);
						} catch (err) {
							return res.json({ Error: "Error inserting data in database" });
						}
					});
				}
			}
		});
	} catch (err) {
		console.log({ Error: "Error" });
	}
});

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
