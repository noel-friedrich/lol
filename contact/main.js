const contactMessageContainer = document.getElementById("contact-message-output")

const formContainer = document.querySelector(".form")
const emailInput = formContainer.querySelector("[name=email]")
const messageInput = formContainer.querySelector("[name=message]")
const submitButton = formContainer.querySelector("[type=submit]")

const successOutput = document.getElementById("success-output")
const errorOutput = document.getElementById("error-output")

const urlParams = new URLSearchParams(window.location.search)

if (urlParams.has("message")) {
    contactMessageContainer.textContent = urlParams.get("message").replaceAll("<br>", "\n")
}

if (urlParams.has("emailContent")) {
    messageInput.value = urlParams.get("emailContent")
}

if (urlParams.has("email")) {
    const email = urlParams.get("email")
    emailInput.value = email
    if (email == "none") {
        emailInput.style.display = "none"
    }
}

let handlingRequest = false

submitButton.onclick = async () => {
    if (handlingRequest) {
        return
    }

    handlingRequest = true

    try {
        const formData = new FormData()
        formData.append("email", emailInput.value)
        formData.append("message", messageInput.value)
    
        const rawResult = await fetch("../api/contact.php", {
            method: "POST",
            body: formData
        })
    
        const response = await rawResult.json()
    
        if (response.ok) {
            successOutput.textContent = "Your message was successfully sent."
            successOutput.style.display = "block"
            errorOutput.style.display = "none"
            emailInput.value = ""
            messageInput.value = ""
        } else {
            errorOutput.textContent = response.error
            successOutput.style.display = "none"
            errorOutput.style.display = "block"
        }
    } catch (e) {
        console.error(e)
        errorOutput.textContent = e.message
        errorOutput.style.display = "block"
    }

    handlingRequest = false
}