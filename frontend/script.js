```javascript
// =====================================================
// J.A.R.V.I.S
// GEMINI + TEXT + MICROPHONE + VOICE
// =====================================================


// =====================================================
// 1. DOM ELEMENTS
// =====================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");


// =====================================================
// 2. GEMINI API KEY
// =====================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {

    API_KEY = prompt(
        "Enter your Gemini API Key:"
    );

    if (API_KEY) {

        API_KEY = API_KEY.trim();

        localStorage.setItem(
            "jarvis_key",
            API_KEY
        );
    }

}


// =====================================================
// 3. GEMINI MODEL
// =====================================================

const MODELS = [

    "gemini-2.5-flash",

    "gemini-2.0-flash"

];


// =====================================================
// 4. ADD MESSAGE
// =====================================================

function add(text, who = "") {

    if (!chat) {
        return;
    }

    const d = document.createElement("div");

    d.className =
        `msg ${who}`.trim();

    d.textContent = text;

    chat.appendChild(d);

    chat.scrollTop =
        chat.scrollHeight;
}


// =====================================================
// 5. REMOVE THINKING MESSAGE
// =====================================================

function removeThinking() {

    const messages =
        chat.querySelectorAll(".msg.ai");

    if (messages.length === 0) {
        return;
    }

    const lastMessage =
        messages[messages.length - 1];

    if (
        lastMessage.textContent ===
        "J.A.R.V.I.S: Thinking..."
    ) {

        lastMessage.remove();

    }

}


// =====================================================
// 6. CALL GEMINI
// =====================================================

async function callGemini(prompt) {

    if (!API_KEY) {

        throw new Error(
            "Gemini API Key is missing."
        );

    }


    let lastError;


    for (const model of MODELS) {

        try {

            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;


            const response =
                await fetch(url, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        contents: [

                            {

                                parts: [

                                    {

                                        text:
                                            "You are J.A.R.V.I.S, a helpful AI assistant. " +
                                            "Answer clearly and naturally. " +
                                            "User message: " +
                                            prompt

                                    }

                                ]

                            }

                        ]

                    })

                });


            const data =
                await response.json();


            if (
                !response.ok ||
                data.error
            ) {

                throw new Error(

                    data?.error?.message ||

                    `HTTP ${response.status}: ${response.statusText}`

                );

            }


            const text =
                data?.candidates?.[0]
                    ?.content?.parts
                    ?.map(
                        part =>
                            part.text || ""
                    )
                    .join("")
                    .trim();


            if (!text) {

                throw new Error(
                    "Gemini returned an empty response."
                );

            }


            return text;


        } catch (error) {

            console.error(
                "Gemini model failed:",
                model,
                error
            );

            lastError = error;

        }

    }


    throw (
        lastError ||

        new Error(
            "All Gemini models failed."
        )

    );

}


// =====================================================
// 7. ASK GEMINI
// =====================================================

async function askGemini(prompt) {

    add(
        "J.A.R.V.I.S: Thinking...",
        "ai"
    );


    try {

        const reply =
            await callGemini(prompt);


        removeThinking();


        add(
            "J.A.R.V.I.S: " +
            reply,
            "ai"
        );


        speak(reply);


    } catch (error) {

        console.error(error);


        removeThinking();


        add(

            "J.A.R.V.I.S ERROR: " +

            (
                error.message ||
                "Unknown error"
            ),

            "ai"

        );

    }

}


// =====================================================
// 8. SEND MESSAGE
// =====================================================

function sendMessage() {

    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    add(
        "YOU: " + text,
        "user"
    );


    input.value = "";


    askGemini(text);

}


// =====================================================
// 9. SEND BUTTON
// =====================================================

if (sendBtn) {

    sendBtn.addEventListener(

        "click",

        sendMessage

    );

}


// =====================================================
// 10. ENTER KEY
// =====================================================

if (input) {

    input.addEventListener(

        "keydown",

        function (event) {

            if (

                event.key === "Enter" &&

                !event.shiftKey

            ) {

                event.preventDefault();

                sendMessage();

            }

        }

    );

}


// =====================================================
// 11. SPEECH RECOGNITION
// =====================================================

const SpeechRecognition =

    window.SpeechRecognition ||

    window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-US";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    // -------------------------------------------------
    // SPEECH RESULT
    // -------------------------------------------------

    recognition.onresult =
        function (event) {

            const text =

                event.results[0][0]
                    .transcript;


            add(

                "YOU: " +
                text,

                "user"

            );


            askGemini(text);

        };


    // -------------------------------------------------
    // SPEECH ERROR
    // -------------------------------------------------

    recognition.onerror =
        function (event) {

            console.error(
                "Microphone error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                add(

                    "J.A.R.V.I.S: Microphone permission denied. Please allow microphone access.",

                    "ai"

                );

            } else {

                add(

                    "J.A.R.V.I.S: Microphone error - " +
                    event.error,

                    "ai"

                );

            }

        };


    // -------------------------------------------------
    // SPEECH END
    // -------------------------------------------------

    recognition.onend =
        function () {

            if (micBtn) {

                micBtn.textContent =
                    "🎙️";

            }

        };


    // -------------------------------------------------
    // MICROPHONE BUTTON
    // -------------------------------------------------

    if (micBtn) {

        micBtn.addEventListener(

            "click",

            async function () {

                try {

                    await navigator.mediaDevices
                        .getUserMedia({
                            audio: true
                        });


                    recognition.start();


                    micBtn.textContent =
                        "LISTENING...";


                } catch (error) {

                    console.error(
                        error
                    );


                    add(

                        "J.A.R.V.I.S: Please allow microphone permission.",

                        "ai"

                    );

                }

            }

        );

    }


} else {

    if (micBtn) {

        micBtn.addEventListener(

            "click",

            function () {

                add(

                    "J.A.R.V.I.S: Speech Recognition is not supported in this browser. Please use Google Chrome.",

                    "ai"

                );

            }

        );

    }

}


// =====================================================
// 12. TEXT TO SPEECH
// =====================================================

let voices = [];


function loadVoices() {

    voices =
        window.speechSynthesis
            .getVoices();

}


if (
    "speechSynthesis" in window
) {

    loadVoices();


    window.speechSynthesis
        .onvoiceschanged =
        loadVoices;

}


// =====================================================
// 13. SPEAK
// =====================================================

function speak(text) {

    if (
        !(
            "speechSynthesis"
            in window
        )
    ) {

        return;

    }


    window.speechSynthesis
        .cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.rate =
        1.0;


    utterance.pitch =
        0.85;


    utterance.volume =
        1.0;


    const englishVoice =

        voices.find(

            voice =>

                voice.lang &&

                voice.lang
                    .toLowerCase()
                    .startsWith("en")

        );


    if (englishVoice) {

        utterance.voice =
            englishVoice;

    }


    window.speechSynthesis
        .speak(
            utterance
        );

}


// =====================================================
// 14. CHANGE GEMINI API KEY
// =====================================================

window.changeJarvisKey =
    function () {

        const newKey =

            prompt(
                "Enter your new Gemini API Key:"
            );


        if (!newKey) {
            return;
        }


        API_KEY =
            newKey.trim();


        localStorage.setItem(

            "jarvis_key",

            API_KEY

        );


        add(

            "J.A.R.V.I.S: Gemini API Key updated.",

            "ai"

        );

    };
```
