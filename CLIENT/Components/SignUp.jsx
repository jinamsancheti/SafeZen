import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import googleButton from "/assets/google_signin_buttons/web/1x/btn_google_signin_light_normal_web.png";

export default function SignUp() {
	const [formData, setFormData] = React.useState({
		email: "",
		password: "",
		age: "",
		joinedNewsletter: true,
	});
	const navigate = useNavigate();

	function goTo(url) {
		window.location.href = url;
	}
	async function auth() {
		const response = await fetch("https://safezen.onrender.com/request", { method: "post" });

		const data = await response.json();
		console.log(data);
		const red_url = data.url;
		console.log(red_url);
		goTo(red_url);
	}

	function handleChange(event) {
		const { name, value, type, checked } = event.target;
		setFormData((prevFormData) => ({
			...prevFormData,
			[name]: type === "checkbox" ? checked : value,
		}));
	}
	axios.defaults.withCredentials = true;
	function handleSubmit(event) {
		event.preventDefault();
		try {
			console.log(formData);
			axios
				.post("https://safezen.onrender.com/signup", formData)
				.then((res) => {
					if (res.data.Status === "Success") navigate("/login");
					else alert(res.data.Error);
				})
				.catch((err) => console.log(err));
		} catch (err) {
			console.log("snfjksuusf fsdfsef hfhsdkkfho");
			console.error(err.message);
		}
		if (formData.joinedNewsletter) {
			console.log("Thanks for signing up for our newsletter!");
		}
	}

	return (
		<div className="form-container">
			<form className="form" onSubmit={handleSubmit}>
				<input
					required
					type="email"
					placeholder="Email address"
					className="form--input mb-1"
					name="email"
					onChange={handleChange}
					value={formData.email}
				/>
				<input
					required
					type="password"
					placeholder="Password"
					className="form--input mb-1"
					name="password"
					onChange={handleChange}
					value={formData.password}
				/>
				<input
					required
					type="text"
					placeholder="Enter your Age"
					className="form--input mb-1"
					name="age"
					onChange={handleChange}
					value={formData.age}
				/>

				<div className="form--marketing">
					<input
						id="okayToEmail"
						type="checkbox"
						name="joinedNewsletter"
						onChange={handleChange}
						checked={formData.joinedNewsletter}
					/>
					<label htmlFor="okayToEmail">I want to join the newsletter</label>
				</div>
				<button className="form--submit">Sign up</button>

				<br />
				{/* <hr height="2px" border-width="0" color="gray" background-color="gray" /> */}
				<p>-----------OR-----------</p>

				
				<button className="btn-auth" type="button" onClick={() => auth()}>
					<img className="btn-auth-img" src={googleButton} alt="google sign in" />
				</button>
				{/* <div>
                    <GoogleLogin
                        clientId = {clientId}
                        buttonText = "Login"
                        onSuccess={onSuccess}
                        onFailure={onFailure}
                        cookiePolicy={'single_host_origin'}
                        isSignedIn={true}
                    />
                </div> */}
				{/* <GLogin/> */}
			</form>
		</div>
	);
}
