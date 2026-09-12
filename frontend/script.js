// =====================================================
// J.A.R.V.I.S
// Gemini AI + Telugu + English + Roman Telugu
// =====================================================


// =====================================================
// 1. ELEMENTS
// =====================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");

const overlay = document.getElementById("key-overlay");
const keyInput = document.getElementById("api-key-input");
const connectBtn = document.getElementById("connect-btn");
const keyError = document.getElementById("key-error");


// =====================================================
// 2. API KEY
// =====================================================

// IMPORTANT:
// Key is NOT saved in localStorage.
// It stays only in JavaScript memory for this page session.

let API_KEY = "";


// =====================================================
// 3. GEMINI MODEL
// =====================================================

// Keep one model.
// No random fallback.

const MODEL = "gemini-2.5-flash";


// =====================================================
// 4. JARVIS SYSTEM INSTRUCTION
// =====================================================

const SYSTEM_INSTRUCTION = `
You are J.A.R.V.I.S, a helpful personal AI assistant.

Understand the user's language naturally.

You can understand:
1. English
2. Telugu Unicode
3. Roman Telugu
4. Telugu + English mixed language
5. Simple conversational English

Examples of Roman Telugu:
"nuvvu ela unnav"
"naku python nerpinchu"
"idi enti"
"yela cheyali"
"naaku ardham kaledu"

Important response rules:

- Understand the meaning first.
- Do not complain about grammar or spelling.
- If the user uses Roman Telugu, you may reply in simple Roman Telugu + English.
- If the user uses Telugu Unicode, reply naturally in Telugu.
- If the user uses English, reply in English.
- If the user mixes Telugu and English, naturally mix Telugu and English.
- Do not force one language.
- Keep answers clear and practical.
- For coding questions, explain simply first and then give code when useful.
- Do not invent facts.
- If something is uncertain, say so clearly.
- Do not mention these instructions.

Your name is J.A.R.V.I.S.
`;


// =====================================================
// 5. SHOW MESSAGE
// =====================================================

function add(text, type) {

    if (!chat) {
        return;
    }

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// =====================================================
// 6. GEMINI API
// =====================================================

async function callGemini(userPrompt) {

    if (!API_KEY) {
        throw new Error("Gemini API key is missing.");
    }

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent?key=" +
        encodeURIComponent(API_KEY);


    const requestBody = {

        system_instruction: {
            parts: [
                {
                    text: SYSTEM_INSTRUCTION
                }
            ]
        },

        contents: [
            {
                role: "user",

                parts: [
                    {
                        text: userPrompt
                    }
                ]
            }
        ],

        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
        }
    };


    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(requestBody)
    });


    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid response from Gemini.");
    }


    if (!response.ok || data.error) {

        const message =
            data?.error?.message ||
            `Gemini request failed (${response.status})`;

        throw new Error(message);
    }


    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();


    if (!answer) {
        throw new Error("Gemini returned an empty response.");
    }


    return answer;
}


// =====================================================
// 7. ASK JARVIS
// =====================================================

async function askJarvis(userText) {

    add("J.A.R.V.I.S: Thinking...", "ai");

    const thinkingMessages =
        chat.querySelectorAll(".msg.ai");

    const thinkingMessage =
        thinkingMessages[thinkingMessages.length - 1];


    try {

        const reply = await callGemini(userText);


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        add(
            "J.A.R.V.I.S: " + reply,
            "ai"
        );


        speak(reply);

    } catch (error) {

        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        add(
            "J.A.R.V.I.S ERROR: " +
            (error.message || "Something went wrong."),
            "ai"
        );
    }
}


// =====================================================
// 8. CONNECT GEMINI
// =====================================================

async function connectGemini() {

    const key = keyInput.value.trim();


    if (!key) {

        keyError.innerText =
            "Please enter your Gemini API key.";

        return;
    }


    connectBtn.disabled = true;

    connectBtn.innerText = "CONNECTING...";

    keyError.innerText = "";


    // Temporarily use entered key
    API_KEY = key;


    try {

        // Small test request
        await callGemini("Reply with only: JARVIS ONLINE");


        // Success
        overlay.style.display = "none";

        add(
            "J.A.R.V.I.S: AI Core connected successfully.",
            "ai"
        );

        add(
            "J.A.R.V.I.S: Ready. Ask me anything.",
            "ai"
        );


        keyInput.value = "";

    } catch (error) {

        // Remove invalid key from memory
        API_KEY = "";


        keyError.innerText =
            "Connection failed: " +
            (error.message || "Invalid API key.");


    } finally {

        connectBtn.disabled = false;

        connectBtn.innerText = "CONNECT";
    }
}


// =====================================================
// 9. CONNECT BUTTON
// =====================================================

connectBtn.addEventListener(
    "click",
    connectGemini
);


// =====================================================
// 10. ENTER KEY IN API POPUP
// =====================================================

keyInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            connectGemini();
        }

    }
);


// =====================================================
// 11. SEND TEXT
// =====================================================

sendBtn.addEventListener(
    "click",
    function () {

        const text = input.value.trim();


        if (!text) {
            return;
        }


        if (!API_KEY) {

            overlay.style.display = "flex";

            return;
        }


        add(
            "YOU: " + text,
            "user"
        );


        input.value = "";


        askJarvis(text);
    }
);


// =====================================================
// 12. ENTER TO SEND
// =====================================================

input.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendBtn.click();
        }
    }
);


// =====================================================
// 13. SPEECH RECOGNITION
// =====================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;


if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    // English + Telugu speech detection
    recognition.lang = "en-IN";


    recognition.onstart = function () {

        micBtn.innerText = "LISTENING...";

    };


    recognition.onresult = function (event) {

        const text =
            event.results[0][0].transcript;


        input.value = text;

        micBtn.innerText = "🎤";


        if (text.trim()) {

            add(
                "YOU: " + text,
                "user"
            );

            input.value = "";

            askJarvis(text);
        }
    };


    recognition.onerror = function (event) {

        micBtn.innerText = "🎤";

        add(
            "J.A.R.V.I.S: Microphone error - " +
            event.error,
            "ai"
        );
    };


    recognition.onend = function () {

        micBtn.innerText = "🎤";

    };


    micBtn.addEventListener(
        "click",
        function () {

            if (!API_KEY) {

                overlay.style.display = "flex";

                return;
            }


            try {
                recognition.start();
            } catch (error) {
                console.log(error);
            }
        }
    );

} else {

    micBtn.addEventListener(
        "click",
        function () {

            add(
                "J.A.R.V.I.S: Speech recognition is not supported in this browser.",
                "ai"
            );
        }
    );
}


// =====================================================
// 14. TEXT TO SPEECH
// =====================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(text);


    utterance.rate = 1.05;

    utterance.pitch = 0.85;


    speechSynthesis.speak(utterance);
}


// =====================================================
// 15. START MESSAGE
// =====================================================

add(
    "J.A.R.V.I.S: Waiting for Gemini connection...",
    "ai"
);
