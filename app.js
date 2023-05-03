const startRecordingButton = document.getElementById("start-recording");
const stopRecordingButton = document.getElementById("stop-recording");
const transcriptionTextarea = document.getElementById("transcription");
const getRecommendationsButton = document.getElementById("get-recommendations");
const recommendationsList = document.getElementById("recommendations");

// Replace with your own API key
const apiKey = "NAuygfghjkjhgvbnmk8JUk113ZJebCXNOuE6xp";

const openai = axios.create({
  baseURL: "https://api.openai.com/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
});

let recorder;

startRecordingButton.addEventListener("click", () => {
  if (recorder) {
    recorder.stopRecording();
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    recorder = RecordRTC(stream, { type: "audio" });
    recorder.startRecording();
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
  });
});

stopRecordingButton.addEventListener("click", async () => {
  stopRecordingButton.disabled = true;
  recorder.stopRecording(async () => {
    const audioBlob = recorder.getBlob();
    try {
      const response = await transcribeAudio(audioBlob);
      transcriptionTextarea.value = response.text;
      transcriptionTextarea.readOnly = false;
      getRecommendationsButton.disabled = false;
      startRecordingButton.disabled = false; // Add this line
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  });
});

getRecommendationsButton.addEventListener("click", async () => {
  const promptInput = document.getElementById("prompt-input");
  const userPrompt = promptInput.value;
  const transcription = transcriptionTextarea.value;

  try {
    const feedback = await getIeltsFeedback(userPrompt, transcription);

    const recommendations = feedback.split("\n");
    recommendationsList.innerHTML = "";
    for (const recommendation of recommendations) {
      const listItem = document.createElement("li");
      listItem.textContent = recommendation;
      recommendationsList.appendChild(listItem);
    }
  } catch (error) {
    console.error("Error getting IELTS feedback:", error);
  }
});

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error transcribing audio:", error);
  }
}

async function getIeltsFeedback(userPrompt, transcription) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content:
              "As an AI language model, provide feedback to help improve English proficiency for the IELTS exam. Based on the following prompt and user transcription, please give recommendations:",
          },
          {
            role: "user",
            content: userPrompt,
          },
          {
            role: "assistant",
            content: transcription,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error getting IELTS feedback:", error);
  }
}
