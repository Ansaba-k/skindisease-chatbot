import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import Base64 from 'base64-js'
import MarkdownIt from 'markdown-it'
import { maybeShowApiKeyBanner } from './gemini-api-banner'

let API_KEY = 'AIzaSyD4ljwXLHyD-tORaUY4943dloJNSsMQeOM' // Replace with your Gemini API key

maybeShowApiKeyBanner(API_KEY)

const imageInput = document.getElementById('image-input')
const questionInput = document.getElementById('question-input')
const sendButton = document.getElementById('send-button')
const chatBox = document.getElementById('chat-box')

let imageBase64 = null
let md = new MarkdownIt()

// Convert uploaded image to Base64
imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const buffer = await file.arrayBuffer()
  imageBase64 = Base64.fromByteArray(new Uint8Array(buffer))
})

// Append message to the chat
function appendMessage(role, text) {
  const div = document.createElement('div')
  div.className = message ${role}
  div.innerHTML = role === 'bot' ? md.render(text) : text
  chatBox.appendChild(div)
  chatBox.scrollTop = chatBox.scrollHeight
}

// Handle send button
sendButton.onclick = async () => {
  const question = questionInput.value.trim()
  if (!imageBase64 || !question) {
    alert('Please upload an image and enter a question.')
    return
  }

  appendMessage('user', question)
  questionInput.value = ''
  appendMessage('bot', 'Thinking...')

  try {
    const contents = [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
        { text: question }
      ]
    }]

    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [{
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
      }]
    })

    const result = await model.generateContentStream({ contents })

    // Replace "Thinking..." with actual bot answer
    const thinkingMessage = chatBox.querySelector('.message.bot:last-child')
    let buffer = []
    for await (let response of result.stream) {
      buffer.push(response.text())
      thinkingMessage.innerHTML = md.render(buffer.join(''))
    }

  } catch (err) {
    console.error(err)
    appendMessage('bot', ❌ Error: ${err.message || err})
  }
}
