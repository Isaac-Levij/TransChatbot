// Toggle chat visibility
const chatToggleBtn = document.getElementById('chat-toggle');
const chatSection = document.getElementById('chat-section');

// Function to show only the toggle button when offline
function updateVisibilityBasedOnNetwork() {
    if (navigator.onLine) {
        // If online, show both the chat toggle and the chat section
        chatToggleBtn.style.display = 'block'; // Make sure toggle button is visible
        chatSection.style.display = 'none'; // Chat section starts hidden
    } else {
        // If offline, hide the chat section and show only the toggle button
        chatSection.style.display = 'none'; // Ensure chat section is hidden
        chatToggleBtn.style.display = 'block'; // Keep toggle button visible
    }
}

// Initial check for network status on page load
updateVisibilityBasedOnNetwork();

// Listen for network status changes (online/offline events)
window.addEventListener('online', updateVisibilityBasedOnNetwork);
window.addEventListener('offline', updateVisibilityBasedOnNetwork);

// Toggle chat visibility on button click
chatToggleBtn.addEventListener('click', () => {
    if (chatSection.style.display === 'none' || chatSection.style.display === '') {
        chatSection.style.display = 'flex';
    } else {
        chatSection.style.display = 'none';
    }
});

// Text-to-Speech function
function playText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

// Function to get current time in HH:MM:SS format
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = [];

    async function sendMessage(userMessage, language) {
        const systemInstruction = `You are a translating chatbot that translates what it is given to ${language}`;
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                }
            ],
            systemInstruction: {
                role: "model",
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 1,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 100
            }
        };
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=API_KEY', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Request failed with status:', response.status);
                console.error('Error details:', errorDetails);
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            const modelResponse = result.candidates[0].content.parts[0].text ?? 'No response from the model.';
            chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
            chatHistory.push({ role: 'model', parts: [{ text: modelResponse }] });
            return modelResponse;
        } catch (error) {
            console.error('Error:', error);
            return 'Sorry, there was an error processing your request.';
        }
    }

    // Handle submit button click event
    document.getElementById('submit-btn').addEventListener('click', async function () {
        const userInput = document.getElementById('user-message').value;
        const langInput = document.getElementById('language').value;
        const chatContainer = document.getElementById('chat-history');
        const currentTime = getCurrentTime();

        if (userInput.trim() !== '') {
            const modelResponse = await sendMessage(userInput, langInput);

            // Display the user input in the chat history
            const userMessage = document.createElement('div');
            userMessage.classList.add('message', 'user-message');
            userMessage.textContent = `You: ${userInput}`;

            // Add speech button to user message
            const userSpeechBtn = document.createElement('button');
            userSpeechBtn.classList.add('speech-btn');
            userSpeechBtn.innerHTML = '🔊';
            userSpeechBtn.onclick = () => playText(userInput);

            // Add timestamp for user message
            const userTimestamp = document.createElement('span');
            userTimestamp.classList.add('timestamp');
            userTimestamp.textContent = ` ${currentTime}`;

            // Append speech button and timestamp to user message
            userMessage.appendChild(userSpeechBtn);
            userMessage.appendChild(userTimestamp);
            chatContainer.appendChild(userMessage);

            // Display the model response in the chat history
            const modelMessage = document.createElement('div');
            modelMessage.classList.add('message', 'model-message');
            modelMessage.textContent = `AI: ${modelResponse}`;

            // Add speech button to model message
            const modelSpeechBtn = document.createElement('button');
            modelSpeechBtn.classList.add('speech-btn');
            modelSpeechBtn.innerHTML = '🔊';
            modelSpeechBtn.onclick = () => playText(modelResponse);

            // Add timestamp for model message
            const modelTimestamp = document.createElement('span');
            modelTimestamp.classList.add('timestamp');
            modelTimestamp.textContent = ` ${currentTime}`;

            // Append speech button and timestamp to model message
            modelMessage.appendChild(modelSpeechBtn);
            modelMessage.appendChild(modelTimestamp);
            chatContainer.appendChild(modelMessage);

            // Scroll the chat window to the bottom after new message
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Clear the input field
            document.getElementById('user-message').value = '';
        } else {
            alert('Please enter a message.');
        }
    });
});
