const startRecordingButton = document.getElementById("start-recording");
const stopRecordingButton = document.getElementById("stop-recording");
const transcriptionTextarea = document.getElementById("transcription");
const getRecommendationsButton = document.getElementById("get-recommendations");
const recommendationsList = document.getElementById("recommendations");

// Replace with your own API key
const apiKey = "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";

const openai = axios.create({
  baseURL: "https://api.openai.com/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
});

let recorder;

startRecordingButton.addEventListener("click", () => {
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
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  });
});

getRecommendationsButton.addEventListener("click", async () => {
  const prompt = transcriptionTextarea.value;
  try {
    const response = await openai.post("gpt-4/create", {
      prompt: `As a GPT-4 language model, give feedback to an IELTS candidate on how to improve their English proficiency. ${prompt}`,
      max_tokens: 150,
      n: 1,
      stop: null,
      temperature: 0.8,
    });

    const recommendations = response.data.choices[0].text.trim().split("\n");
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
