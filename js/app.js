/**
 * API Tester - Main application JavaScript
 * A client-side application for testing APIs
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const apiForm = document.getElementById('apiForm');
    const methodSelect = document.getElementById('methodSelect');
    const urlInput = document.getElementById('urlInput');
    const sendRequestBtn = document.getElementById('sendRequestBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Header and parameter row management
    const headerParams = document.getElementById('headerParams');
    const queryParams = document.getElementById('queryParams');
    const formParams = document.getElementById('formParams');
    const addHeaderBtn = document.getElementById('addHeaderBtn');
    const addQueryBtn = document.getElementById('addQueryBtn');
    const addFormBtn = document.getElementById('addFormBtn');
    
    // Content type management
    const contentTypeSelect = document.getElementById('contentTypeSelect');
    const jsonBodyContainer = document.getElementById('jsonBodyContainer');
    const formBodyContainer = document.getElementById('formBodyContainer');
    const textBodyContainer = document.getElementById('textBodyContainer');
    const xmlBodyContainer = document.getElementById('xmlBodyContainer');
    const jsonBodyInput = document.getElementById('jsonBodyInput');
    
    // Auth management
    const authTypeSelect = document.getElementById('authTypeSelect');
    const basicAuthInputs = document.getElementById('basicAuthInputs');
    const bearerAuthInputs = document.getElementById('bearerAuthInputs');
    const apiKeyAuthInputs = document.getElementById('apiKeyAuthInputs');
    
    // Response elements
    const loadingResponse = document.getElementById('loadingResponse');
    const responseDetails = document.getElementById('responseDetails');
    const emptyResponse = document.getElementById('emptyResponse');
    const errorResponse = document.getElementById('errorResponse');
    const errorResponseMessage = document.getElementById('errorResponseMessage');
    const responseStatus = document.getElementById('responseStatus');
    const responseStatusText = document.getElementById('responseStatusText');
    const responseTime = document.getElementById('responseTime');
    const responseSize = document.getElementById('responseSize');
    const responseBodyCode = document.getElementById('responseBodyCode');
    const responseBodyText = document.getElementById('responseBodyText');
    const responseHeadersTable = document.getElementById('responseHeadersTable');
    const prettyBtn = document.getElementById('prettyBtn');
    const rawBtn = document.getElementById('rawBtn');
    const responseBodyPretty = document.getElementById('responseBodyPretty');
    const responseBodyRaw = document.getElementById('responseBodyRaw');
    const copyResponseBtn = document.getElementById('copyResponseBtn');

    /**
     * Event Listeners
     */

    // Form submission
    apiForm.addEventListener('submit', handleFormSubmit);
    
    // Content type change
    contentTypeSelect.addEventListener('change', handleContentTypeChange);
    
    // Auth type change
    authTypeSelect.addEventListener('change', handleAuthTypeChange);
    
    // Parameter row management
    addHeaderBtn.addEventListener('click', () => addParameterRow(headerParams, 'header'));
    addQueryBtn.addEventListener('click', () => addParameterRow(queryParams, 'query'));
    addFormBtn.addEventListener('click', () => addParameterRow(formParams, 'form'));
    
    // Response view toggle
    prettyBtn.addEventListener('click', () => toggleResponseView('pretty'));
    rawBtn.addEventListener('click', () => toggleResponseView('raw'));
    
    // Copy response
    copyResponseBtn.addEventListener('click', copyResponseToClipboard);
    
    // Clear form
    clearBtn.addEventListener('click', clearForm);

    // Method select changes body visibility
    methodSelect.addEventListener('change', handleMethodChange);

    /**
     * Function to handle form submission
     * @param {Event} e - Form submit event
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Reset response area
        showLoadingState();
        
        // Get form data
        const requestData = collectRequestData();
        
        try {
            // Record start time
            const startTime = performance.now();
            
            // Send the request
            const response = await sendApiRequest(requestData);
            
            // Calculate time taken
            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);
            
            // Display the response
            displayResponse(response, timeTaken);
        } catch (error) {
            displayError(error.message);
        }
    }

    /**
     * Validate the form data
     * @returns {boolean} Whether the form is valid
     */
    function validateForm() {
        let isValid = true;
        
        // Reset validation states
        apiForm.classList.remove('was-validated');
        
        // Check URL
        if (!urlInput.value || !isValidUrl(urlInput.value)) {
            urlInput.classList.add('is-invalid');
            isValid = false;
        } else {
            urlInput.classList.remove('is-invalid');
        }
        
        // Check JSON body if applicable
        if (contentTypeSelect.value === 'application/json' && jsonBodyInput.value.trim() !== '') {
            try {
                JSON.parse(jsonBodyInput.value);
                document.getElementById('jsonBodyError').style.display = 'none';
            } catch (e) {
                document.getElementById('jsonBodyError').style.display = 'block';
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Check if a string is a valid URL
     * @param {string} string - URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Collect all request data from the form
     * @returns {Object} Object containing request data
     */
    function collectRequestData() {
        // Basic request data
        const requestData = {
            method: methodSelect.value,
            url: urlInput.value,
            headers: {},
            queryParams: {},
            body: null
        };
        
        // Collect headers
        document.querySelectorAll('.header-param-row').forEach(row => {
            const keyInput = row.querySelector('.header-key');
            const valueInput = row.querySelector('.header-value');
            
            if (keyInput.value.trim()) {
                requestData.headers[keyInput.value.trim()] = valueInput.value;
            }
        });
        
        // Collect query parameters
        document.querySelectorAll('.query-param-row').forEach(row => {
            const keyInput = row.querySelector('.query-key');
            const valueInput = row.querySelector('.query-value');
            
            if (keyInput.value.trim()) {
                requestData.queryParams[keyInput.value.trim()] = valueInput.value;
            }
        });
        
        // Handle authentication
        handleAuthentication(requestData);
        
        // Handle request body based on content type
        if (['POST', 'PUT', 'PATCH'].includes(requestData.method)) {
            const contentType = contentTypeSelect.value;
            requestData.headers['Content-Type'] = contentType;
            
            switch (contentType) {
                case 'application/json':
                    if (jsonBodyInput.value.trim()) {
                        try {
                            requestData.body = JSON.parse(jsonBodyInput.value);
                        } catch (e) {
                            // Validation already done in validateForm
                        }
                    }
                    break;
                    
                case 'application/x-www-form-urlencoded':
                    const formData = {};
                    document.querySelectorAll('.form-param-row').forEach(row => {
                        const keyInput = row.querySelector('.form-key');
                        const valueInput = row.querySelector('.form-value');
                        
                        if (keyInput.value.trim()) {
                            formData[keyInput.value.trim()] = valueInput.value;
                        }
                    });
                    requestData.body = formData;
                    break;
                    
                case 'text/plain':
                    requestData.body = document.getElementById('textBodyInput').value;
                    break;
                    
                case 'application/xml':
                    requestData.body = document.getElementById('xmlBodyInput').value;
                    break;
                    
                case 'multipart/form-data':
                    // For multipart/form-data, we'll handle it differently when sending
                    const multipartFormData = {};
                    document.querySelectorAll('.form-param-row').forEach(row => {
                        const keyInput = row.querySelector('.form-key');
                        const valueInput = row.querySelector('.form-value');
                        
                        if (keyInput.value.trim()) {
                            multipartFormData[keyInput.value.trim()] = valueInput.value;
                        }
                    });
                    requestData.formData = multipartFormData;
                    break;
            }
        }
        
        return requestData;
    }

    /**
     * Handle authentication based on the selected auth type
     * @param {Object} requestData - Request data object
     */
    function handleAuthentication(requestData) {
        const authType = authTypeSelect.value;
        
        switch (authType) {
            case 'basic':
                const username = document.getElementById('usernameInput').value;
                const password = document.getElementById('passwordInput').value;
                
                if (username && password) {
                    const base64Credentials = btoa(`${username}:${password}`);
                    requestData.headers['Authorization'] = `Basic ${base64Credentials}`;
                }
                break;
                
            case 'bearer':
                const token = document.getElementById('tokenInput').value;
                
                if (token) {
                    requestData.headers['Authorization'] = `Bearer ${token}`;
                }
                break;
                
            case 'apiKey':
                const keyName = document.getElementById('apiKeyName').value;
                const keyValue = document.getElementById('apiKeyValue').value;
                const keyLocation = document.getElementById('apiKeyLocation').value;
                
                if (keyName && keyValue) {
                    if (keyLocation === 'header') {
                        requestData.headers[keyName] = keyValue;
                    } else if (keyLocation === 'query') {
                        requestData.queryParams[keyName] = keyValue;
                    }
                }
                break;
        }
    }

    /**
     * Send the API request
     * @param {Object} requestData - Request data object
     * @returns {Object} Object containing response data
     */
    async function sendApiRequest(requestData) {
        // Build URL with query parameters
        let url = new URL(requestData.url);
        
        // Add query parameters
        Object.entries(requestData.queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        // Create fetch options
        const fetchOptions = {
            method: requestData.method,
            headers: requestData.headers,
            redirect: 'follow'
        };
        
        // Handle request body
        if (['POST', 'PUT', 'PATCH'].includes(requestData.method) && requestData.body !== null) {
            if (requestData.headers['Content-Type'] === 'application/json') {
                fetchOptions.body = JSON.stringify(requestData.body);
            } else if (requestData.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                const formBody = new URLSearchParams();
                Object.entries(requestData.body).forEach(([key, value]) => {
                    formBody.append(key, value);
                });
                fetchOptions.body = formBody;
            } else if (requestData.headers['Content-Type'] === 'multipart/form-data') {
                // For multipart/form-data, we need to use FormData
                const formData = new FormData();
                Object.entries(requestData.formData).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                fetchOptions.body = formData;
                // Remove the Content-Type header to let the browser set it with the boundary
                delete fetchOptions.headers['Content-Type'];
            } else {
                // Plain text or XML
                fetchOptions.body = requestData.body;
            }
        }
        
        // Send the request
        try {
            const response = await fetch(url.toString(), fetchOptions);
            
            // Get response text
            const responseText = await response.text();
            
            // Parse response if it's JSON
            let responseBody = responseText;
            let isJson = false;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseBody = JSON.parse(responseText);
                    isJson = true;
                }
            } catch (e) {
                // If parsing fails, keep as text
            }
            
            // Convert headers to object
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            
            return {
                status: response.status,
                statusText: response.statusText,
                headers: headers,
                body: responseBody,
                isJson: isJson,
                size: responseText.length
            };
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }
    }

    /**
     * Display the API response
     * @param {Object} response - Response object
     * @param {number} timeTaken - Time taken in milliseconds
     */
    function displayResponse(response, timeTaken) {
        // Hide loading and error states
        loadingResponse.classList.add('d-none');
        errorResponse.classList.add('d-none');
        emptyResponse.classList.add('d-none');
        responseDetails.classList.remove('d-none');
        
        // Display status
        const statusClass = getStatusClass(response.status);
        responseStatus.innerHTML = `
            <span class="${statusClass}">${response.status}</span>
        `;
        
        // Display response metadata
        responseStatusText.textContent = `${response.status} ${response.statusText}`;
        responseTime.textContent = `${timeTaken} ms`;
        responseSize.textContent = formatBytes(response.size);
        
        // Display response body
        if (response.isJson) {
            responseBodyCode.textContent = JSON.stringify(response.body, null, 2);
            responseBodyCode.className = 'language-json';
            hljs.highlightElement(responseBodyCode);
            
            responseBodyText.textContent = JSON.stringify(response.body, null, 2);
        } else {
            // Check if it's XML
            if (typeof response.body === 'string' && response.body.trim().startsWith('<')) {
                responseBodyCode.textContent = response.body;
                responseBodyCode.className = 'language-xml';
                hljs.highlightElement(responseBodyCode);
            } else {
                responseBodyCode.textContent = response.body;
                responseBodyCode.className = '';
            }
            
            responseBodyText.textContent = response.body;
        }
        
        // Display response headers
        responseHeadersTable.innerHTML = '';
        Object.entries(response.headers).forEach(([key, value]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${key}</strong></td>
                <td>${value}</td>
            `;
            responseHeadersTable.appendChild(row);
        });
        
        // Default to pretty view
        toggleResponseView('pretty');
    }

    /**
     * Display an error message
     * @param {string} message - Error message
     */
    function displayError(message) {
        loadingResponse.classList.add('d-none');
        responseDetails.classList.add('d-none');
        emptyResponse.classList.add('d-none');
        errorResponse.classList.remove('d-none');
        
        errorResponseMessage.textContent = message;
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        loadingResponse.classList.remove('d-none');
        responseDetails.classList.add('d-none');
        emptyResponse.classList.add('d-none');
        errorResponse.classList.add('d-none');
    }

    /**
     * Get CSS class for status code display
     * @param {number} status - HTTP status code
     * @returns {string} CSS class name
     */
    function getStatusClass(status) {
        if (status >= 200 && status < 300) {
            return 'status-success';
        } else if (status >= 300 && status < 400) {
            return 'status-redirect';
        } else if (status >= 400 && status < 500) {
            return 'status-client-error';
        } else if (status >= 500) {
            return 'status-server-error';
        } else {
            return 'status-info';
        }
    }

    /**
     * Format bytes to human-readable size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Add a new parameter row
     * @param {HTMLElement} container - Container element
     * @param {string} type - Parameter type (header, query, form)
     */
    function addParameterRow(container, type) {
        const row = document.createElement('div');
        row.className = `row ${type}-param-row mb-2`;
        
        row.innerHTML = `
            <div class="col-5">
                <input type="text" class="form-control ${type}-key" placeholder="Key">
            </div>
            <div class="col-5">
                <input type="text" class="form-control ${type}-value" placeholder="Value">
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-outline-danger remove-param">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        
        // Add click event for remove button
        row.querySelector('.remove-param').addEventListener('click', () => {
            container.removeChild(row);
        });
        
        container.appendChild(row);
    }

    /**
     * Handle content type change
     */
    function handleContentTypeChange() {
        const contentType = contentTypeSelect.value;
        
        // Hide all containers
        jsonBodyContainer.classList.remove('active');
        formBodyContainer.classList.remove('active');
        textBodyContainer.classList.remove('active');
        xmlBodyContainer.classList.remove('active');
        
        // Show appropriate container
        switch (contentType) {
            case 'application/json':
                jsonBodyContainer.classList.add('active');
                break;
            case 'application/x-www-form-urlencoded':
            case 'multipart/form-data':
                formBodyContainer.classList.add('active');
                break;
            case 'text/plain':
                textBodyContainer.classList.add('active');
                break;
            case 'application/xml':
                xmlBodyContainer.classList.add('active');
                break;
        }
    }

    /**
     * Handle auth type change
     */
    function handleAuthTypeChange() {
        const authType = authTypeSelect.value;
        
        // Hide all auth input groups
        basicAuthInputs.style.display = 'none';
        bearerAuthInputs.style.display = 'none';
        apiKeyAuthInputs.style.display = 'none';
        
        // Show appropriate auth input group
        switch (authType) {
            case 'basic':
                basicAuthInputs.style.display = 'block';
                break;
            case 'bearer':
                bearerAuthInputs.style.display = 'block';
                break;
            case 'apiKey':
                apiKeyAuthInputs.style.display = 'block';
                break;
        }
    }

    /**
     * Handle method change
     */
    function handleMethodChange() {
        const method = methodSelect.value;
        const bodyTab = document.getElementById('body-tab');
        
        if (['GET', 'HEAD'].includes(method)) {
            // Disable body tab for GET and HEAD
            bodyTab.classList.add('disabled');
            bodyTab.setAttribute('tabindex', '-1');
            bodyTab.setAttribute('aria-disabled', 'true');
            
            // Switch to headers tab if body tab is active
            if (bodyTab.classList.contains('active')) {
                document.getElementById('headers-tab').click();
            }
        } else {
            // Enable body tab for other methods
            bodyTab.classList.remove('disabled');
            bodyTab.removeAttribute('tabindex');
            bodyTab.setAttribute('aria-disabled', 'false');
        }
    }

    /**
     * Toggle response view between pretty and raw
     * @param {string} view - View type ('pretty' or 'raw')
     */
    function toggleResponseView(view) {
        if (view === 'pretty') {
            responseBodyPretty.classList.remove('d-none');
            responseBodyRaw.classList.add('d-none');
            prettyBtn.classList.add('active');
            rawBtn.classList.remove('active');
        } else {
            responseBodyPretty.classList.add('d-none');
            responseBodyRaw.classList.remove('d-none');
            prettyBtn.classList.remove('active');
            rawBtn.classList.add('active');
        }
    }

    /**
     * Copy response to clipboard
     */
    function copyResponseToClipboard() {
        const textToCopy = responseBodyText.textContent;
        
        // Use Clipboard API if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Show tooltip or message
                    showCopySuccess();
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        } else {
            // Fallback for browsers without Clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';  // Prevent scrolling to bottom
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            try {
                document.execCommand('copy');
                showCopySuccess();
            } catch (err) {
                console.error('Could not copy text: ', err);
            }
            
            document.body.removeChild(textarea);
        }
    }

    /**
     * Show copy success message
     */
    function showCopySuccess() {
        const originalText = copyResponseBtn.innerHTML;
        copyResponseBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
        
        setTimeout(() => {
            copyResponseBtn.innerHTML = originalText;
        }, 2000);
    }

    /**
     * Clear the form
     */
    function clearForm() {
        // Reset URL input
        urlInput.value = '';
        
        // Reset method select to GET
        methodSelect.value = 'GET';
        
        // Clear header params (keep first row)
        const headerRows = document.querySelectorAll('.header-param-row');
        headerRows.forEach((row, index) => {
            if (index === 0) {
                row.querySelector('.header-key').value = '';
                row.querySelector('.header-value').value = '';
            } else {
                headerParams.removeChild(row);
            }
        });
        
        // Clear query params (keep first row)
        const queryRows = document.querySelectorAll('.query-param-row');
        queryRows.forEach((row, index) => {
            if (index === 0) {
                row.querySelector('.query-key').value = '';
                row.querySelector('.query-value').value = '';
            } else {
                queryParams.removeChild(row);
            }
        });
        
        // Clear form params (keep first row)
        const formRows = document.querySelectorAll('.form-param-row');
        formRows.forEach((row, index) => {
            if (index === 0) {
                row.querySelector('.form-key').value = '';
                row.querySelector('.form-value').value = '';
            } else {
                formParams.removeChild(row);
            }
        });
        
        // Reset body inputs
        jsonBodyInput.value = '';
        document.getElementById('textBodyInput').value = '';
        document.getElementById('xmlBodyInput').value = '';
        
        // Reset content type and auth type
        contentTypeSelect.value = 'application/json';
        handleContentTypeChange();
        
        authTypeSelect.value = 'none';
        handleAuthTypeChange();
        
        // Reset auth inputs
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        document.getElementById('tokenInput').value = '';
        document.getElementById('apiKeyName').value = '';
        document.getElementById('apiKeyValue').value = '';
        document.getElementById('apiKeyLocation').value = 'header';
        
        // Handle method change to enable/disable body tab
        handleMethodChange();
    }

    /**
     * Initialize the application
     */
    function init() {
        // Set default content type
        handleContentTypeChange();
        
        // Set default auth type
        handleAuthTypeChange();
        
        // Setup method handling
        handleMethodChange();
    }

    // Initialize the application
    init();
});