import express, { json } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";
import fs from "fs";
import axios from "axios";

dotenv.config();

// console.log(process.env.OPENAI_API_KEY);
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

const translateText = async (text, lang) => {
	let data = {
		text: text,
		src_lang: "auto",
		tgt_lang: lang,
	};

	axios.post("https://lesan.ai/translate-text", data).then(function (response) {
		// console.log("||> " + response.data[0]["text"]);
		const lang_tr_data = {
			lang_tr: response.data[0]["text"],
			source: "lesan",
		};
		return lang_tr_data;
	});

	// console.log("Res: " + responses.data[0]["text"]);
	// return text;
};

// const xx = await translateText("ጤና ይስጥልኝ! እንዴት ነህ?", "en");
// console.log("|> " + xx);

app.get("/", async (req, res) => {
	res.status(200).send({
		message: "Hello from Zenox!",
	});
});

app.post("/", async (req, res) => {
	try {
		let prompt = req.body.prompt;
		const lang = req.body.lang;

		// console.log("Language: ", lang);

		if (lang === "en") {
			const response = await openai.createCompletion({
				model: "text-davinci-003",
				prompt: `${prompt}`,
				temperature: 0,
				max_tokens: 3000,
				top_p: 1,
				frequency_penalty: 0.5,
				presence_penalty: 0,
			});

			res.status(200).send({
				bot: response.data.choices[0].text,
			});
		} else {
			// let engText = translateText(prompt, "en");
			var data = {
				text: prompt,
				src_lang: "am",
				tgt_lang: "en",
			};
			var engText = await axios.post("https://lesan.ai/translate-text", data);

			// console.log(" :-: ", engText.data[0]["text"]);
			const response = await openai.createCompletion({
				model: "text-davinci-003",
				prompt: `${engText.data[0]["text"]}`,
				temperature: 0,
				max_tokens: 3000,
				top_p: 1,
				frequency_penalty: 0.5,
				presence_penalty: 0,
			});

			// let res_data = translateText(response.data.choices[0].text, "am");

			data = {
				text: response.data.choices[0].text,
				src_lang: "auto",
				tgt_lang: "am",
			};
			var amhText = await axios.post("https://lesan.ai/translate-text", data);

			res.status(200).send({
				bot: amhText.data[0]["text"],
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).send(error || "Something went wrong");
	}
});

app.post("/user", async (req, res) => {
	console.log(">: ", 123);
	try {
		// console.log("Req: ", req.body);
		// const ip = req.body;
		const prompt = req.body;
		// prompt["ip"] = ip;
		prompt["timestamp"] = new Date().toString();
		prompt["view"] = 1;

		let rawData = fs.readFileSync("userData.json"); //read existing json file
		let data = JSON.parse(rawData); //convert string to object
		data.push(prompt); // push new object
		// console.log(JSON.stringify(data));
		let newDataString = JSON.stringify(data); //convert object to string
		fs.writeFileSync("userData.json", newDataString); //write string to file

		res.status(200).send({
			bot: "Saved!",
		});
	} catch (error) {
		console.error(error);
		res.status(500).send(error || "Something went wrong");
	}
});

app.post("/translate", async (req, res) => {
	try {
		var res_lang_data = [{ tr_text: "default", source: "default" }];
		const req_data = req.body;
		var data = {
			text: req_data["text"],
			src_lang: "en",
			tgt_lang: req_data["lang"],
		};
		var lesan_am = "";
		await axios
			.post("https://lesan.ai/translate-text", data)
			.then(function (response) {
				lesan_am = response.data[0]["text"];

				res_lang_data.push({
					tr_text: lesan_am,
					source: "lesan",
				});
			});

		res.status(200).send({
			bot: res_lang_data,
		});

		// console.log(":> ", req_data["text"]);
		// console.log(":> ", res_lang_data);
	} catch (error) {
		console.error(error);
		res.status(500).send(error || "Something went wrong");
	}
});

app.listen(5000, () =>
	console.log("AI server started on http://localhost:5000")
);
