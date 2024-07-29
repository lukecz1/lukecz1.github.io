// Get references to various elements
const uploadForm = document.getElementById('upload-form');
const processButtonContainer = document.getElementById('process-button-container');
const previewImage = document.getElementById('preview-image');
const processedImageContainer = document.getElementById('processed-image-container');
const processedImage = document.getElementById('processed-image');
const clickToEnlarge = document.querySelector('.click-to-enlarge');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const surveyForm = document.getElementById('survey-form');
const feedbackMessage = document.getElementById('feedback-message');
const fileNameDisplay = document.getElementById('file-name-display'); // Element to display file name
const feedbackHeader = document.getElementById('feedback-header'); // Header for feedback form
const footer = document.getElementById('contact');

// Webcam elements
const enableWebcamButton = document.getElementById('enable-webcam');
const terminateWebcamButton = document.getElementById('terminate-webcam');
const captureButton = document.getElementById('capture-button');
const webcamFeed = document.getElementById('webcam-feed');
const processedImage2 = document.getElementById('processed-image2');
const imageModal2 = document.getElementById('image-modal2');
const modalImage2 = document.getElementById('modal-image2');
const surveyForm2 = document.getElementById('survey-form2');
const feedbackMessage2 = document.getElementById('feedback-message2');
const clickToEnlarge2 = document.querySelector('.click-to-enlarge2');
const processedImageContainer2 = document.getElementById('processed-image-container2');

// Handle form submission for file upload
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(uploadForm);

    // Add source type to form data
    formData.append('source_type', 'file'); // Indicate file upload

    try {
        const response = await fetch('/process_image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        displayProcessedImage(data);
    } catch (error) {
        console.error('Error processing image:', error);
    }
});

// Handle file input change
document.getElementById('image').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            processButtonContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Store the file name for later display
        uploadForm.dataset.fileName = file.name;
    }
});

// Display processed image
function displayProcessedImage(data) {
    if (data.annotated_image) {
        // Hide the preview image
        previewImage.style.display = 'none';

        // Hide the "Process Image" button
        processButtonContainer.style.display = 'none';

        // Show the processed image
        processedImage.src = `/uploads/${data.annotated_image}`;
        processedImage.style.display = 'block';
        clickToEnlarge.style.display = 'block';
        feedbackMessage.style.display = 'none';

        // Display processing information under the button
        const processingInfo = document.getElementById('processing-info');
        let itemsIdentifiedText = 'Items identified:\n';
        for (const key in data.itemsIdentified) {
            itemsIdentifiedText += `${key}: ${data.itemsIdentified[key]}\n`;
        }
        processingInfo.textContent = itemsIdentifiedText;
        processingInfo.style.whiteSpace = 'pre'; // Preserve newlines in textContent
        processingInfo.style.display = 'block'; // Show the processing info
        
        // Optionally, display speed information if available
        if (data.speed) {
            let speedText = `Speed: ${data.speed.total.toFixed(2)} ms\n`;
            speedText += `Preprocess: ${data.speed.preprocess.toFixed(2)} ms\n`;
            speedText += `Inference: ${data.speed.inference.toFixed(2)} ms\n`;
            speedText += `Postprocess: ${data.speed.postprocess.toFixed(2)} ms\n`;
            processingInfo.textContent += speedText;
        }

        // Display the file name
        fileNameDisplay.textContent = `File: ${uploadForm.dataset.fileName}`;
        fileNameDisplay.style.display = 'block';

        // Reset the file input
        document.getElementById('image').value = '';
        uploadForm.dataset.fileName = ''; // Clear the stored file name

        // Insert feedback form into the feedback container
        generateFeedbackForm(data.itemsIdentified, data.originalImage);
    } else {
        console.error('Failed to process image');
    }
}

// Define a function to handle feedback form generation
function generateFeedbackForm(itemsIdentified, originalImage) {
    // Get references to the feedback form elements
    const feedbackContainer = document.getElementById('feedback-container');
    
    // Clear existing content in the feedback container
    feedbackContainer.innerHTML = '';

    // Create and append the feedback form
    const feedbackForm = document.createElement('form');
    feedbackForm.id = 'feedback-form';
    feedbackForm.innerHTML = `
        <div>
            <label for="accuracy">Did we accurately identify the objects?</label>
            <input type="radio" id="accuracy-yes" name="accuracy" value="yes"> Yes
            <input type="radio" id="accuracy-no" name="accuracy" value="no"> No
        </div>
        <div>
            <label for="comments">Comments:</label>
            <textarea id="comments" name="comments"></textarea>
        </div>
        <button type="submit">Submit Feedback</button>
    `;
    feedbackContainer.appendChild(feedbackForm);

    // Handle feedback form submission
    feedbackForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(feedbackForm);
        const feedbackEntries = Object.fromEntries(formData.entries());

        const incorrectItems = {};
        for (const key in feedbackEntries) {
            if (feedbackEntries[key] === 'no') {
                const itemKey = key.replace('feedback-', '');
                incorrectItems[itemKey] = itemsIdentified[itemKey];
            }
        }

       // Handle feedback response
       const feedbackContainer = document.getElementById('feedback-container');
       if (Object.keys(incorrectItems).length > 0) {
           const feedbackMessage = document.createElement('p');
           feedbackMessage.textContent = 'Uh sorry, we\'re struggling to identify that part. Please re-upload again.';
           feedbackMessage.style.paddingRight = '100px'; 
           feedbackMessage.style.paddingTop = '100px';
           feedbackMessage.style.fontWeight = 'bold'; // Make the text bold
           feedbackMessage.style.fontSize = '25px'; // Increase font size
           feedbackMessage.style.color = 'orange'; // Change text color
           feedbackContainer.innerHTML = '';
           feedbackContainer.appendChild(feedbackMessage);

           // Create and add "How to Use" button
           const howToUseButton = document.createElement('button');
           howToUseButton.textContent = 'Go to How to Use Section';
           howToUseButton.style.marginRight = '100px';
           howToUseButton.addEventListener('click', () => {


             // Clear the item list
            const processingInfo = document.getElementById('processing-info');
            if (processingInfo) {
                processingInfo.textContent = ''; // Clear the text content
                processingInfo.style.display = 'none'; // Hide the element if necessary
            }

            // Hide or reset the processed image preview
            if (processedImage) {
                processedImage.style.display = 'none'; // Hide the processed image
            }
            // hide click to enlarge link under pic
            if (clickToEnlarge) {
                clickToEnlarge.style.display = 'none';
            }

            // hide the file name of upload 
            if (fileNameDisplay) {
                fileNameDisplay.textContent = ''; // Clear the file name text
                fileNameDisplay.style.display = 'none'; // Hide the file name display
            }

            // Hide the modal
            imageModal.style.display = 'none';
            imageModal2.style.display = 'none'; // Hide the second modal if it's open

            const howToUseSection = document.getElementById('how-to-use');
            if (howToUseSection) {
                howToUseSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.error('How to Use section not found.');
            }
        });
        feedbackContainer.appendChild(howToUseButton);

       } else {
           const feedbackMessage = document.createElement('p');
           feedbackMessage.textContent = 'Thank you for your feedback!';
           feedbackMessage.style.paddingRight = '250px'; 
           feedbackMessage.style.paddingTop = '100px';
           feedbackMessage.style.fontWeight = 'bold'; // Make the text bold
           feedbackMessage.style.fontSize = '35px'; // Increase font size
           feedbackMessage.style.color = 'green'; // Change text color
           feedbackContainer.innerHTML = '';
           feedbackContainer.appendChild(feedbackMessage);
       }
   });
}

// Placeholder function for reprocessing incorrect items
function reprocessIncorrectItems(incorrectItems, originalImage) {
    // Placeholder for the function that reprocesses incorrect items
    console.log('Reprocessing incorrect items:', incorrectItems);
}

// Handle click on processed image to open the first modal
processedImage.addEventListener('click', () => {
    modalImage.src = processedImage.src;
    imageModal.style.display = 'block';
    if (footer) {
        footer.style.display = 'none'; // Hide footer
    }
});

// Handle click on the first modal close button
document.querySelector('.close').addEventListener('click', () => {
    imageModal.style.display = 'none';
    if (footer) {
        footer.style.display = 'block'; // Show footer
    }
});

// Enable webcam
enableWebcamButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            webcamFeed.srcObject = stream;
            webcamFeed.style.display = 'block';
            enableWebcamButton.style.display = 'none';
            terminateWebcamButton.style.display = 'inline-block';
            captureButton.style.display = 'inline-block';

            fetch('/enable_webcam')
                .then(response => response.json())
                .then(data => console.log(data.message))
                .catch(error => console.error('Error:', error));
        })
        .catch((error) => {
            console.error('Error accessing webcam:', error);
        });
});

// Terminate webcam
terminateWebcamButton.addEventListener('click', () => {
    const stream = webcamFeed.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
    webcamFeed.style.display = 'none';
    enableWebcamButton.style.display = 'inline-block';
    terminateWebcamButton.style.display = 'none';
    captureButton.style.display = 'none';

    fetch('/terminate_webcam')
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error:', error));
});

// Capture image from webcam
captureButton.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = webcamFeed.videoWidth;
    canvas.height = webcamFeed.videoHeight;
    canvas.getContext('2d').drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
        const uniqueName = `webcam_capture_${Date.now()}.jpg`; // Use a timestamp to create a unique name
        const formData = new FormData();
        formData.append('image', blob, uniqueName);

        formData.append('source_type', 'webcam'); // Indicate webcam source

        try {
            const response = await fetch('/process_image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.annotated_image) {
                // Stop the webcam
                const stream = webcamFeed.srcObject;
                if (stream) {
                    const tracks = stream.getTracks();
                    tracks.forEach(track => track.stop());
                }

                // Hide the webcam feed and buttons
                webcamFeed.style.display = 'none';
                captureButton.style.display = 'none';
                terminateWebcamButton.style.display = 'none';

                // Show the processed image
                processedImage2.src = `/uploads/${data.annotated_image}`;
                processedImage2.style.display = 'block';
                processedImage2.style.maxWidth = '200px'; // Ensure image fits within the container
                processedImage2.style.maxHeight = '200px'; // Ensure image fits within the container
                clickToEnlarge2.style.display = 'block';

                // Ensure the container exists
                if (processedImageContainer2) {
                    // Clear any existing content
                    processedImageContainer2.innerHTML = '';

                    // Append the annotated image to the container
                    processedImageContainer2.appendChild(processedImage2);
                } else {
                    console.error('processedImageContainer2 not found.');
                }

                // Display file information and objects identified
                const fileInfo = document.createElement('p');
                fileInfo.textContent = `File: ${uniqueName}`;
                fileInfo.style.paddingTop = '20px';
                fileInfo.style.fontWeight = 'bold';
                fileInfo.style.fontSize = '20px';
                fileInfo.style.color = 'white';

                // Format objects identified
                let formattedObjects = 'Objects Identified:\n';
                for (const [key, value] of Object.entries(data.itemsIdentified)) {
                    formattedObjects += `${key}: ${value}\n`;
                }
                
                const objectsIdentified = document.createElement('pre');
                objectsIdentified.textContent = formattedObjects;
                objectsIdentified.style.paddingTop = '10px';
                objectsIdentified.style.fontWeight = 'bold';
                objectsIdentified.style.fontSize = '20px';
                objectsIdentified.style.color = 'white';
                objectsIdentified.style.whiteSpace = 'pre-wrap'; // Preserve new lines

                // Append file information and objects identified to the container
                const infoContainer = document.getElementById('info-container');
                if (infoContainer) {
                    infoContainer.innerHTML = '';
                    infoContainer.appendChild(fileInfo);
                    infoContainer.appendChild(objectsIdentified);
                } else {
                    console.error('info-container not found.');
                }

                // Clear previous feedback from the form
                const feedbackForm = document.getElementById('feedback-form');
                if (feedbackForm) {
                    feedbackForm.reset(); // Reset all form fields
                } else {
                    console.error('feedback-form not found.');
                }

            }
        } catch (error) {
            console.error('Error processing image:', error);
        }
    });
});


// Handle click on the second processed image to open the second modal
processedImage2.addEventListener('click', () => {
    modalImage2.src = processedImage2.src;
    imageModal2.style.display = 'block';
    if (footer) {
        footer.style.display = 'none'; // Hide footer
    }
});



// Handle goofy question answers
function handleGoofyAnswer(event) {
    const answer = event.target.value;
    const responseContainer = document.getElementById('goofy-response');
    const responseMessage = document.getElementById('response-message');
    const backButton = document.getElementById('back-to-how-to-use');

    // Remove any existing classes
    responseMessage.classList.remove('yes', 'no');

    if (answer === 'yes') {
        responseMessage.textContent = 'Thanks for your feedback!';
        responseMessage.classList.add('yes'); // Add the 'yes' class
        backButton.style.display = 'none'; // Hide the button
    } else if (answer === 'no') {
        responseMessage.textContent = 'Sorry, I\'m struggling to identify this part';
        responseMessage.classList.add('no'); // Add the 'no' class
        backButton.style.display = 'inline'; // Show the button
    }

    responseContainer.style.display = 'block'; // Show the response container
    const goofyQuestion = document.getElementById('goofy-question');
    goofyQuestion.style.display = 'none'; // Hide the goofy question form
}

// Ensure the modal content is present
const modalContent2 = document.querySelector('#image-modal2 .modal-content2');
if (modalContent2) {
    // Add the goofy question if not already present
    const goofyQuestionContainer = document.getElementById('goofy-question-container');
    if (goofyQuestionContainer) {
        // Clear any existing question
        goofyQuestionContainer.innerHTML = '';

        // Create and add the goofy question
        const goofyQuestionHtml = `
            <div id="goofy-question">
                <p>Was this image identified correctly?</p>
                <input type="radio" id="goofy-yes" name="goofy-question" value="yes">
                <label for="goofy-yes">Absolutely!</label><br>
                <input type="radio" id="goofy-no" name="goofy-question" value="no">
                <label for="goofy-no">Nope, not even close!</label>
            </div>
            <div id="goofy-response" style="display: none;">
                <p id="response-message" class="response-message"></p>
                <a id="back-to-how-to-use" href="#how-to-use" style="display: none;">Upload another image</a>
            </div>
        `;
        goofyQuestionContainer.innerHTML = goofyQuestionHtml;

        // Add event listeners for radio buttons
        document.getElementById('goofy-yes').addEventListener('change', handleGoofyAnswer);
        document.getElementById('goofy-no').addEventListener('change', handleGoofyAnswer);
    } else {
        console.error('Goofy question container not found.');
    }
} else {
    console.error('Modal content not found.');
}

// Add event listener to the "Go to How to Use Section" button
document.getElementById('back-to-how-to-use').addEventListener('click', () => {
    // Hide Modal 2
    const imageModal2 = document.getElementById('image-modal2');
    if (imageModal2) {
        imageModal2.style.display = 'none';
    }

    // Hide file information and objects identified
    const infoContainer = document.getElementById('info-container');
    if (infoContainer) {
        infoContainer.innerHTML = ''; // Clear the content of the container
    }

    // Hide the webcam screenshot
    const processedImage2 = document.getElementById('processed-image2');
    if (processedImage2) {
        processedImage2.style.display = 'none';
    }
    
    // Show the "Enable Webcam" button
    const enableWebcamButton = document.getElementById('enable-webcam');
    if (enableWebcamButton) {
        enableWebcamButton.style.display = 'inline-block'; // Ensure it's visible
    }

    // Reset the feedback form
    resetFeedbackForm();
});

// Handle click on the second modal close button
document.querySelector('.close2').addEventListener('click', () => {
    const imageModal2 = document.getElementById('image-modal2');
    imageModal2.style.display = 'none';
    const footer = document.querySelector('footer');
    if (footer) {
        footer.style.display = 'block'; // Show footer
    }

    // Reset the feedback form
    resetFeedbackForm();
});

// Function to reset the feedback form
function resetFeedbackForm() {
    const goofyYes = document.getElementById('goofy-yes');
    const goofyNo = document.getElementById('goofy-no');
    const responseContainer = document.getElementById('goofy-response');
    const responseMessage = document.getElementById('response-message');
    const backButton = document.getElementById('back-to-how-to-use');
    const goofyQuestion = document.getElementById('goofy-question');

    if (goofyYes) goofyYes.checked = false;
    if (goofyNo) goofyNo.checked = false;
    if (responseContainer) responseContainer.style.display = 'none';
    if (responseMessage) responseMessage.textContent = '';
    if (backButton) backButton.style.display = 'none';
    if (goofyQuestion) goofyQuestion.style.display = 'block'; // Show the goofy question form

    // Remove any existing classes from the response message
    responseMessage.classList.remove('yes', 'no');
}




