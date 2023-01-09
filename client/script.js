import bot from "./assets/bot.svg";
import zenox from "./assets/zenox.svg";
import user from "./assets/user.svg";
import axios from "axios";

const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");
var lang = "en";

let loadInterval;

function loader(element) {
	element.textContent = "";

	loadInterval = setInterval(() => {
		// Update the text content of the loading indicator
		element.textContent += ".";

		// If the loading indicator has reached three dots, reset it
		if (element.textContent === "....") {
			element.textContent = "";
		}
	}, 300);
}

const translateText = async (text) => {
	const tr_response = await fetch("GOOGLE_TRANSLATE_ENDPOINT", {});

	console.log(tr_response);

	return 0;
};

function typeText(element, text) {
	let index = 0;
	// text = translateText(text);
	// if (lang !== "en") {
	// 	text = translateText(text);
	// }

	let interval = setInterval(() => {
		if (index < text.length) {
			element.innerHTML += text.charAt(index);
			index++;
		} else {
			clearInterval(interval);
		}
	}, 20);
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
	const timestamp = Date.now();
	const randomNumber = Math.random();
	const hexadecimalString = randomNumber.toString(16);

	return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
	return `
        <div class="wrapper ${isAi && "ai"}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? "bot" : "user"}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `;
}

const handleSubmit = async (e) => {
	e.preventDefault();

	const data = new FormData(form);

	// user's chatstripe
	chatContainer.innerHTML += chatStripe(false, data.get("prompt"));

	// to clear the textarea input
	form.reset();

	// bot's chatstripe
	const uniqueId = generateUniqueId();
	chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

	// to focus scroll to the bottom
	chatContainer.scrollTop = chatContainer.scrollHeight;

	// specific message div
	const messageDiv = document.getElementById(uniqueId);

	// messageDiv.innerHTML = "..."
	loader(messageDiv);

	const response = await fetch("http://localhost:5000", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			prompt: data.get("prompt"),
			lang: lang,
		}),
	});

	clearInterval(loadInterval);
	messageDiv.innerHTML = " ";

	if (response.ok) {
		const data = await response.json();
		const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'

		typeText(messageDiv, parsedData);
	} else {
		const err = await response.text();

		messageDiv.innerHTML = "Something went wrong";
		// alert(err);
	}
};

document.getElementById("nav__btn").addEventListener("click", function () {
	if (document.getElementById("nav__menu").style.display === "none") {
		document.getElementById("nav__menu").style.display = "block";
		document.getElementById("chat_container").style.marginLeft = "500px";
		document.getElementById("menu_icon").className = "las la-times";
		// chat_container
	} else {
		document.getElementById("nav__menu").style.display = "none";
		document.getElementById("chat_container").style.marginLeft = "60px";
		document.getElementById("menu_icon").className = "las la-bars";
	}
});

document.getElementById("language").addEventListener("change", function () {
	if (this.value !== "en") {
		lang = this.value;
	}
});

form.addEventListener("submit", handleSubmit);
form.addEventListener("keyup", (e) => {
	if (e.keyCode === 13) {
		handleSubmit(e);
	}
});

function getUserData() {
	axios.get("https://api.ipify.org?format=json").then(function (response) {
		const userJson = response.data;

		// console.log(userJson["ip"]);
		axios.post("https://zenox.onrender.com/user", userJson);
	});
}

getUserData();
