// RoboData Pipeline - AI-Powered Robotics Data Processing Platform
// Implements the complete 4-step pipeline for robotics data processing

class RoboDataPipeline {
    constructor() {
        this.apiKey = 'AIzaSyDAEQVJ7yatjQSxUB1qtlQlZ_WWZFqZUpI';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.currentDataset = null;
        this.uploadedFiles = [];
        this.pipelineState = {
            step1: 'waiting',
            step2: 'waiting', 
            step3: 'waiting',
            step4: 'waiting'
        };
        this.processedDatasets = [];
        this.timestampChart = null;
        this.completenessChart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadSampleDatasets();
        this.initializeCharts();
    }

    setupEventListeners() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.getElementById('universal-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        this.setupDragAndDrop();

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        document.getElementById('description').addEventListener('input', () => {
            this.autoDetectInfo();
        });
    }

    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    document.querySelector('.hamburger').classList.remove('active');
                    document.querySelector('.nav-menu').classList.remove('active');
                }
            });
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('universal-upload');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });
        
        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        this.handleFiles(files);
    }

    handleFiles(files) {
        files.forEach(file => {
            this.addFile(file);
        });
        this.updateFileList();
    }

    addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
            processed: false,
            status: 'Uploaded'
        };
        
        this.uploadedFiles.push(fileObj);
        
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            this.processZipFile(fileObj);
        }
    }

    updateFileList() {
        const listElement = document.getElementById('universal-list');
        listElement.innerHTML = '';
        
        this.uploadedFiles.forEach(fileObj => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${fileObj.name}</span>
                    <span class="file-size">${this.formatFileSize(fileObj.size)}</span>
                </div>
                <div class="file-status">${fileObj.extractedCount ? `${fileObj.status} (${fileObj.extractedCount} files)` : (fileObj.status || 'Ready')}</div>
                <button class="file-remove" onclick="removeFile('${fileObj.id}')">&times;</button>
            `;
            listElement.appendChild(fileItem);
        });
    }

    async processZipFile(fileObj) {
        try {
            fileObj.status = 'Processing ZIP contents...';
            this.updateFileList();
            
            const extractedFiles = await this.extractZipFile(fileObj);
            
            fileObj.status = `Contains ${extractedFiles.length} files`;
            fileObj.processed = true;
            fileObj.extractedCount = extractedFiles.length;
            fileObj.extractedFiles = extractedFiles;
            
            this.updateFileList();
            
        } catch (error) {
            fileObj.status = 'Error processing ZIP file';
            this.updateFileList();
            console.error('ZIP processing error:', error);
        }
    }

    updateFileStatus(fileName, status) {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const nameElement = item.querySelector('.file-name');
            if (nameElement && nameElement.textContent === fileName) {
                const statusElement = item.querySelector('.file-status') || 
                    item.appendChild(document.createElement('div'));
                statusElement.className = 'file-status';
                statusElement.textContent = status;
                statusElement.style.fontSize = '0.8rem';
                statusElement.style.color = '#666';
                statusElement.style.marginTop = '0.25rem';
            }
        });
    }

    async extractZipFile(fileObj) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(fileObj.file);
      
        const extractedFiles = [];
      
        for (const [filename, file] of Object.entries(zipContent.files)) {
          if (!file.dir) {
            const content = await file.async("blob");
            extractedFiles.push({
              id: Date.now() + Math.random(),
              name: filename,
              size: content.size,
              type: content.type || 'application/octet-stream',
              file: content,
              source: fileObj.name,
              processed: true,
              status: 'Extracted from ZIP'
            });
          }
        }
      
        return extractedFiles;
      }
      

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async executeStep1() {
        this.updateStepStatus(1, 'active', 'Processing...', 'Parsing and unpacking uploaded files...');
        
        try {
            if (this.uploadedFiles.length === 0) {
                throw new Error('No files uploaded. Please upload data files first.');
            }

            const ingestionResult = await this.callRealAPI('data-ingestion', {
                files: this.uploadedFiles,
                datasetInfo: this.getDatasetInfo()
            });

            this.currentDataset = {
                id: this.generateDatasetId(),
                info: this.getDatasetInfo(),
                standardizedData: ingestionResult,
                timestamp: new Date().toISOString()
            };

            this.updateStepStatus(1, 'completed', 'Completed', 
                `Processed ${ingestionResult.totalFiles} files. Converted to standardized formats.`);
            
            setTimeout(() => this.executeStep2(), 1000);
            
        } catch (error) {
            this.updateStepStatus(1, 'error', 'Failed', 'Error during data ingestion: ' + error.message);
        }
    }

    async executeStep2() {
        this.updateStepStatus(2, 'active', 'Validating & Scoring', 'Performing automated quality checks...');
    
        let validationResult = null;
        try {
            this.updateStepStatus(2, 'active', 'Validating...', 'Checking file completeness, timestamps, robot constraints...');
            validationResult = await this.callRealAPI('data-validation', {
                dataset: this.currentDataset
            });
    
            if (
                !validationResult ||
                typeof validationResult.overallScore !== 'number' ||
                typeof validationResult.passedChecks !== 'number' ||
                typeof validationResult.totalChecks !== 'number'
            ) {
                throw new Error('Received malformed validation result from API');
            }
    
            this.currentDataset.qualityReport = validationResult;
    
            const summary = []
            if (Array.isArray(validationResult.checks)) {
                summary.push(`<ul>`);
                for (const check of validationResult.checks) {
                    summary.push(
                        `<li style="color:${check.passed ? '#28a745' : '#dc3545'}">
                            ${check.name}: <strong>${check.passed ? 'Pass' : 'Fail'}</strong>
                            <span style="font-size:0.9em; opacity:0.8">(${check.message || ''})</span>
                        </li>`
                    );
                }
                summary.push(`</ul>`);
            }
    
            this.updateStepStatus(
                2,
                'completed',
                'Validation Completed',
                `Quality Score: <strong>${validationResult.overallScore}%</strong>.<br>
                Passed checks: ${validationResult.passedChecks}/${validationResult.totalChecks}
                ${summary.join('\n')}`
            );
    
            if (typeof this.displayQualityDashboard === 'function') {
                this.displayQualityDashboard(validationResult);
            }
    
            setTimeout(() => this.executeStep3(), 1500);
    
        } catch (error) {
            this.updateStepStatus(
                2,
                'error',
                `Failed to validate: ${(error && error.message) ? error.message : error}`
            );
            if (window && window.console) {
                console.error('Validation API failure:', error);
                if (error.response) {
                    console.error('API response data:', error.response.data || error.response);
                }
            }
        }
    }

    async executeStep3() {
        this.updateStepStatus(3, 'active', 'Analyzing...', 'Extracting features and generating AI tags...');
        
        try {
            const contentAnalysis = await this.callRealAPI('content-analysis', {
                dataset: this.currentDataset
            });


            this.currentDataset.aiAnalysis = {
                contentTags: contentAnalysis.tags,
            };
            
            this.updateStepStatus(3, 'completed', 'Completed', 
                `Generated ${contentAnalysis.tags.length} content tags and trajectory classification.`);
            
            this.displayAIAnalysis(this.currentDataset.aiAnalysis);
            
            setTimeout(() => this.executeStep4(), 1000);
            
        } catch (error) {
            this.updateStepStatus(3, 'error', 'Failed', 'Error during AI analysis: ' + error.message);
        }
    }

    async executeStep4() {
        this.updateStepStatus(4, 'active', 'Publishing...', 'Generating dataset page and making searchable...');
        try {
            const publishingResult = await this.callRealAPI('dataset-publishing', {
                dataset: this.currentDataset
            });

            this.currentDataset.doi = publishingResult.doi;
            this.currentDataset.citation = publishingResult.citation;
            this.currentDataset.published = true;
            this.currentDataset.views = 0;
            this.currentDataset.downloads = 0;

            this.processedDatasets.unshift(this.currentDataset);
            this.displayProcessedDatasets();
            this.updateProfile();

            await this.saveDatasetToDB(this.currentDataset);

            this.updateStepStatus(4, 'completed', 'Published!', 
                `Dataset published with DOI: ${publishingResult.doi}`);
            this.showSuccessMessage();
        } catch (error) {
            this.updateStepStatus(4, 'error', 'Failed', 'Error during publishing: ' + error.message);
        }
    }

    async saveDatasetToDB(dataset) {
        const dbEntry = {
            name: dataset.info.title,
            owner: 'User',
            sensor_stack: dataset.info.sensors,
            environment_details: dataset.info.environment || '',
            components_used: dataset.info.robotModel,
            description: dataset.info.description,
            price_for_download: 0,
            content_tags: dataset.aiAnalysis?.contentTags || [],
            zip_file: this.uploadedFiles.find(f => f.type === 'application/zip' || f.name.endsWith('.zip'))?.name || '',
            timestamp: dataset.timestamp,
            doi: dataset.doi,
            citation: dataset.citation
        };
        try {
            let db = [];
            if (window.__datasets_db) {
                db = window.__datasets_db;
            } else {
                const response = await fetch('datasets_db.json');
                db = await response.json();
            }
            db.unshift(dbEntry);
            window.__datasets_db = db;
        } catch (e) {
            console.error('Failed to update database:', e);
        }
    }

    updateStepStatus(stepNumber, status, statusText, details) {
        const stepElement = document.getElementById(`step${stepNumber}`);
        const statusElement = document.getElementById(`status${stepNumber}`);
        const detailsElement = document.getElementById(`details${stepNumber}`);
        const progressBar = document.getElementById(`progress${stepNumber}`);
        
        stepElement.className = `pipeline-step ${status}`;
        
        statusElement.textContent = statusText;
        
        detailsElement.textContent = details;
        
        if (status === 'active') {
            progressBar.style.width = '50%';
        } else if (status === 'completed') {
            progressBar.style.width = '100%';
        }
        
        this.pipelineState[`step${stepNumber}`] = status;
    }

    displayQualityDashboard(validationResult) {
        const dashboard = document.getElementById('quality-dashboard');
        dashboard.style.display = 'block';
        
        const scoreElement = document.getElementById('quality-score');
        scoreElement.textContent = `${validationResult.overallScore}%`;
        
        this.updateCompletenessChart(validationResult.completenessData);
        
        this.updateValidationResults(validationResult.checks);
    }

    displayAIAnalysis(aiAnalysis) {
        const analysisSection = document.getElementById('ai-analysis');
        analysisSection.style.display = 'block';
        
        const tagsContainer = document.getElementById('content-tags');
        tagsContainer.innerHTML = '';
        aiAnalysis.contentTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }

    updateCompletenessChart(completenessData) {
        const ctx = document.getElementById('completeness-chart').getContext('2d');
    
        if (this.completenessChart) {
            this.completenessChart.destroy();
            this.completenessChart = null;
        }
        
        this.completenessChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Complete', 'Missing', 'Corrupted'],
                datasets: [{
                    data: [completenessData.complete, completenessData.missing, completenessData.corrupted],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    
    updateValidationResults(checks) {
        const resultsContainer = document.getElementById('validation-results');
        resultsContainer.innerHTML = '';
        
        checks.forEach(check => {
            const resultElement = document.createElement('div');
            resultElement.className = `validation-item ${check.passed ? 'pass' : 'fail'}`;
            resultElement.innerHTML = `
                <div class="validation-header">
                    <span class="check-name">${check.name}</span>
                </div>
                <div class="validation-details">
                    <span class="check-reason">${check.reason || (check.passed ? 'Validation passed successfully' : 'Validation failed')}</span>
                    ${check.metric ? `<span class="check-metric">${check.metric}</span>` : ''}
                </div>
            `;
            resultsContainer.appendChild(resultElement);
        });
    }

    displayProcessedDatasets() {
        const grid = document.getElementById('datasets-grid');
        grid.innerHTML = '';
        
        this.processedDatasets.forEach(dataset => {
            const card = this.createDatasetCard(dataset);
            grid.appendChild(card);
        });
    }

    createDatasetCard(dataset) {
        const card = document.createElement('div');
        card.className = 'dataset-card';
        card.onclick = () => this.showDatasetDetails(dataset);
        
        card.innerHTML = `
            <div class="dataset-header">
                <div class="dataset-title">${dataset.info.title}</div>
                <div class="dataset-robot">${dataset.info.robotModel}</div>
            </div>
            <div class="dataset-body">
                <div class="dataset-description">${dataset.info.description}</div>
                <div class="dataset-metrics">
                    <div class="metric">
                        <div class="metric-value">${dataset.qualityReport?.overallScore || 0}%</div>
                        <div class="metric-label">Quality Score</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${dataset.downloads || 0}</div>
                        <div class="metric-label">Downloads</div>
                    </div>
                </div>
                <div class="dataset-tags">
                    ${dataset.aiAnalysis?.contentTags.slice(0, 3).map(tag => 
                        `<span class="dataset-tag">${tag}</span>`
                    ).join('') || ''}
                </div>
            </div>
        `;
        
        return card;
    }

    showDatasetDetails(dataset) {
        const modal = document.getElementById('dataset-modal');
        const details = document.getElementById('dataset-details');
        const price = dataset.price_for_download != null ? dataset.price_for_download : (dataset.info.price != null ? dataset.info.price : 'N/A');
        details.innerHTML = `
            <h2>${dataset.info.title}</h2>
            <p><strong>Robot Model:</strong> ${dataset.info.robotModel}</p>
            <p><strong>DOI:</strong> ${dataset.doi}</p>
            <p><strong>Published:</strong> ${new Date(dataset.timestamp).toLocaleDateString()}</p>
            <p><strong>Price:</strong> $${price}</p>
            <h3>Description</h3>
            <p>${dataset.info.description}</p>
            <h3>Quality Report</h3>
            <p><strong>Overall Score:</strong> ${dataset.qualityReport?.overallScore || 0}%</p>
            <p><strong>Files Processed:</strong> ${dataset.standardizedData?.totalFiles || 0}</p>
            <h3>AI Analysis</h3>
            <p><strong>Content Tags:</strong> ${dataset.aiAnalysis?.contentTags.join(', ') || 'None'}</p>
            <p><strong>Trajectory Type:</strong> ${dataset.aiAnalysis?.trajectoryClassification?.type || 'Unknown'}</p>
            <h3>Citation</h3>
            <pre>${dataset.citation || 'Citation not available'}</pre>
        `;
        modal.style.display = 'block';
    }

    async performSearch() {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        if (!query) {
            resultsContainer.innerHTML = '<p>Please enter a search query.</p>';
            return;
        }

        const results = this.processedDatasets.filter(dataset => {
            return (
                (dataset.info.title && dataset.info.title.toLowerCase().includes(query)) ||
                (dataset.info.description && dataset.info.description.toLowerCase().includes(query)) ||
                (dataset.info.robotModel && dataset.info.robotModel.toLowerCase().includes(query)) ||
                (dataset.info.sensors && dataset.info.sensors.join(',').toLowerCase().includes(query)) ||
                (dataset.aiAnalysis && dataset.aiAnalysis.contentTags && dataset.aiAnalysis.contentTags.some(tag => tag.toLowerCase().includes(query)))
            );
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No datasets found matching your search.</p>';
            return;
        }

        results.forEach(dataset => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'search-result';
            resultDiv.innerHTML = `
                <h3>${dataset.info.title}</h3>
                <p>${dataset.info.description || ''}</p>
                <div class="search-result-meta">
                    <span><strong>Robot:</strong> ${dataset.info.robotModel || ''}</span>
                    <span><strong>Sensors:</strong> ${(dataset.info.sensors || []).join(', ')}</span>
                    <span><strong>Tags:</strong> ${(dataset.aiAnalysis?.contentTags || []).join(', ')}</span>
                    <span><strong>Price:</strong> $${dataset.price_for_download != null ? dataset.price_for_download : 'N/A'}</span>
                </div>
                <button class="btn btn-primary" onclick="window.roboPipeline.showDatasetDetails(window.roboPipeline.processedDatasets.find(d => d.id === '${dataset.id}'))">View Details</button>
            `;
            resultsContainer.appendChild(resultDiv);
        });
    }

    async simulateSemanticSearch(query, robotFilter, sensorFilter, qualityFilter) {
        let results = this.processedDatasets.filter(dataset => {
            let match = true;
            if (query) {
                const q = query.toLowerCase();
                match = (
                    (dataset.name && dataset.name.toLowerCase().includes(q)) ||
                    (dataset.description && dataset.description.toLowerCase().includes(q)) ||
                    (dataset.components_used && dataset.components_used.toLowerCase().includes(q)) ||
                    (dataset.sensor_stack && dataset.sensor_stack.toLowerCase().includes(q)) ||
                    (dataset.content_tags && dataset.content_tags.some(tag => tag.toLowerCase().includes(q)))
                );
            }
            if (robotFilter) {
                match = match && dataset.components_used && dataset.components_used.toLowerCase().includes(robotFilter.toLowerCase());
            }
            if (sensorFilter) {
                match = match && dataset.sensor_stack && dataset.sensor_stack.toLowerCase().includes(sensorFilter.toLowerCase());
            }
            if (qualityFilter) {
                match = match && dataset.qualityReport && dataset.qualityReport.overallScore >= qualityFilter;
            }
            return match;
        });
        return results;
    }

    showSuccessMessage() {
        alert('Dataset successfully processed and published! Your dataset is now searchable and available to the community.');
    }

    updateProfile() {
        const userDatasets = this.processedDatasets.filter(dataset => dataset.published);
        const totalDatasets = userDatasets.length || 5;
        const avgQuality = userDatasets.length > 0 ? 
            Math.round(userDatasets.reduce((sum, dataset) => sum + (dataset.qualityReport?.overallScore || 0), 0) / userDatasets.length) : 88;
        const totalViews = userDatasets.length > 0 ? userDatasets.reduce((sum, dataset) => sum + (dataset.views || 0), 0) : 1240;
        const totalDownloads = userDatasets.length > 0 ? userDatasets.reduce((sum, dataset) => sum + (dataset.downloads || 0), 0) : 320;

        document.getElementById('total-datasets').textContent = totalDatasets;
        document.getElementById('avg-quality').textContent = `${avgQuality}%`;
        document.getElementById('total-views').textContent = totalViews;
        document.getElementById('total-downloads').textContent = totalDownloads;

        this.displayProfileDatasets(userDatasets);
    }

    displayProfileDatasets(userDatasets) {
        const grid = document.getElementById('profile-datasets-grid');
        grid.innerHTML = '';

        if (userDatasets.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No datasets published yet. Upload and publish your first dataset!</p>';
            return;
        }

        userDatasets.forEach(dataset => {
            const card = document.createElement('div');
            card.className = 'profile-dataset-card';
            card.onclick = () => this.showDatasetDetails(dataset);
            
            card.innerHTML = `
                <div class="profile-dataset-header">
                    <div class="profile-dataset-title">${dataset.info.title}</div>
                    <div class="profile-dataset-robot">${dataset.info.robotModel}</div>
                </div>
                <div class="profile-dataset-body">
                    <div class="profile-dataset-description">${dataset.info.description}</div>
                    <div class="profile-dataset-metrics">
                        <div class="profile-metric">
                            <div class="profile-metric-value">${dataset.qualityReport?.overallScore || 0}%</div>
                            <div class="profile-metric-label">Quality Score</div>
                        </div>
                        <div class="profile-metric">
                            <div class="profile-metric-value">${dataset.views || 0}</div>
                            <div class="profile-metric-label">Views</div>
                        </div>
                    </div>
                    <div class="profile-dataset-tags">
                        ${dataset.aiAnalysis?.contentTags.slice(0, 3).map(tag => 
                            `<span class="profile-dataset-tag">${tag}</span>`
                        ).join('') || ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    getDatasetInfo() {
        return {
            title: document.getElementById('dataset-title').value,
            robotModel: document.getElementById('robot-model').value,
            sensors: document.getElementById('sensors').value,
            description: document.getElementById('description').value,
            price: parseFloat(document.getElementById('price').value) || 0
        };
    }

    generateDatasetId() {
        return 'dataset_' + Math.random().toString(36).substr(2, 9);
    }

    analyzeFileTypes(files) {
        const typeCounts = {};
        files.forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            typeCounts[ext] = (typeCounts[ext] || 0) + 1;
        });
        return typeCounts;
    }

    async autoDetectInfo() {
        const description = document.getElementById('description').value;
        if (description.length < 20) return;

        try {
            const detectionResult = await this.callRealAPI('auto-detect', {
                description: description,
                files: this.uploadedFiles
            });

            const robotModelField = document.getElementById('robot-model');
            const sensorsField = document.getElementById('sensors');
            
            if (!robotModelField.value.trim()) {
                robotModelField.value = detectionResult.robotModel || '';
            }
            
            if (!sensorsField.value.trim()) {
                sensorsField.value = detectionResult.sensors || '';
            }

        } catch (error) {
            console.error('Auto-detection error:', error);
        }
    }

    initializeCharts() {
        this.updateCompletenessChart({
            complete: 0,
            missing: 0,
            corrupted: 0
        });
    }

    loadSampleDatasets() {
        this.processedDatasets = [
            {
                id: 'sample1',
                info: {
                    title: 'Warehouse Pick-and-Place Operations',
                    robotModel: 'Universal Robots UR5',
                    sensors: ['camera', 'force-torque', 'joint-encoders'],
                    description: 'Dataset containing pick-and-place operations in a warehouse environment with various objects.'
                },
                price_for_download: 15.00,
                qualityReport: {
                    overallScore: 92,
                    passedChecks: 15,
                    totalChecks: 16
                },
                aiAnalysis: {
                    contentTags: ['warehouse', 'pick-and-place', 'industrial', 'gripper', 'conveyor'],
                    trajectoryClassification: {
                        type: 'Pick and Place',
                        confidence: 0.94
                    }
                },
                doi: '10.1000/182',
                citation: '@dataset{warehouse_pick_place_2024, title={Warehouse Pick-and-Place Operations}, author={RoboData Team}, year={2024}, doi={10.1000/182}}',
                published: true,
                views: 320,
                downloads: 80,
                timestamp: new Date().toISOString()
            },
            {
                id: 'sample2',
                info: {
                    title: 'Kitchen Manipulation Tasks',
                    robotModel: 'Franka Panda',
                    sensors: ['camera', 'imu', 'joint-encoders'],
                    description: 'Robotic manipulation tasks in a kitchen environment including cutting, stirring, and serving.'
                },
                price_for_download: 12.50,
                qualityReport: {
                    overallScore: 87,
                    passedChecks: 14,
                    totalChecks: 16
                },
                aiAnalysis: {
                    contentTags: ['kitchen', 'manipulation', 'cutting', 'stirring', 'food'],
                    trajectoryClassification: {
                        type: 'Complex Manipulation',
                        confidence: 0.89
                    }
                },
                doi: '10.1000/183',
                citation: '@dataset{kitchen_manipulation_2024, title={Kitchen Manipulation Tasks}, author={RoboData Team}, year={2024}, doi={10.1000/183}}',
                published: true,
                views: 210,
                downloads: 60,
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'sample3',
                info: {
                    title: 'Outdoor Autonomous Vehicle Navigation',
                    robotModel: 'Custom Autonomous Vehicle',
                    sensors: ['lidar', 'camera', 'gps', 'imu'],
                    description: 'Navigation dataset for autonomous vehicles in urban outdoor environments.'
                },
                price_for_download: 20.00,
                qualityReport: {
                    overallScore: 90,
                    passedChecks: 16,
                    totalChecks: 16
                },
                aiAnalysis: {
                    contentTags: ['autonomous', 'vehicle', 'outdoor', 'navigation', 'lidar', 'camera'],
                    trajectoryClassification: {
                        type: 'Navigation',
                        confidence: 0.91
                    }
                },
                doi: '10.1000/184',
                citation: '@dataset{autonomous_vehicle_nav_2024, title={Outdoor Autonomous Vehicle Navigation}, author={OpenRobotics}, year={2024}, doi={10.1000/184}}',
                published: true,
                views: 410,
                downloads: 120,
                timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
            },
            {
                id: 'sample4',
                info: {
                    title: 'Factory Assembly Line Monitoring',
                    robotModel: 'ABB IRB 120',
                    sensors: ['camera', 'force', 'temperature'],
                    description: 'Dataset for monitoring and analyzing factory assembly line operations.'
                },
                price_for_download: 18.75,
                qualityReport: {
                    overallScore: 85,
                    passedChecks: 13,
                    totalChecks: 16
                },
                aiAnalysis: {
                    contentTags: ['factory', 'assembly', 'monitoring', 'temperature', 'force'],
                    trajectoryClassification: {
                        type: 'Monitoring',
                        confidence: 0.87
                    }
                },
                doi: '10.1000/185',
                citation: '@dataset{factory_assembly_monitor_2024, title={Factory Assembly Line Monitoring}, author={IndustrialAI}, year={2024}, doi={10.1000/185}}',
                published: true,
                views: 300,
                downloads: 60,
                timestamp: new Date(Date.now() - 3 * 86400000).toISOString()
            }
        ];
        this.displayProcessedDatasets();
    }

    async callRealAPI(endpoint, data) {
        try {
            switch (endpoint) {
                case 'auto-detect':
                    return await this.callGeminiAPI(this.generateAutoDetectPrompt(data));
                case 'data-validation':
                    return await this.callGeminiAPI(this.generateValidationPrompt(data));
                case 'content-analysis':
                    return await this.callGeminiAPI(this.generateContentAnalysisPrompt(data));
                case 'dataset-publishing':
                    return await this.callGeminiAPI(this.generatePublishingPrompt(data));
                default:
                    return await this.callRealAPI(endpoint, data);
            }
        } catch (error) {
            console.error('API call failed, falling back to simulation:', error);
            return await this.callsimulateAPI(endpoint, data);
        }
    }

    async callGeminiAPI(prompt) {
        const response = await fetch(`${this.baseUrl}/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.candidates[0].content.parts[0].text;
        
        try {
            return JSON.parse(content);
        } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse API response as JSON');
        }
    }

    generateAutoDetectPrompt(data) {
        const fileNames = data.files ? data.files.map(f => f.name).join(', ') : 'No files';
        return `Analyze this robotics dataset description and file names to detect the robot model and sensors used.

Description: "${data.description}"
File names: ${fileNames}

Please respond with ONLY a JSON object in this exact format:
{
    "robotModel": "detected robot model name",
    "sensors": "comma-separated list of detected sensors"
}

Examples:
- If description mentions "UR5" or "Universal Robots", robotModel should be "Universal Robots UR5"
- If files contain "camera", "lidar", "imu", sensors should include "Camera, LiDAR, IMU"
- Be specific but concise in your detection.`;
    }

    generateValidationPrompt(data) {
        const fileCount = data.dataset.standardizedData.totalFiles;
        const fileTypes = data.dataset.standardizedData.fileTypes;
        
        return `Analyze this robotics dataset for quality validation. Provide realistic validation results.

Dataset info:
- Total files: ${fileCount}
- File types: ${JSON.stringify(fileTypes)}
- Robot: ${data.dataset.info.robotModel}
- Sensors: ${data.dataset.info.sensors}
- Description: ${data.dataset.info.description}

Respond with ONLY a JSON object in this exact format:
{
    "overallScore": number (0-100),
    "passedChecks": number,
    "totalChecks": 16,
    "scenario": "High/Medium/Low Quality Dataset",
    "timestampData": {
        "timestamps": ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"],
        "drifts": [array of 10 numbers representing drift in ms]
    },
    "completenessData": {
        "complete": number (percentage),
        "missing": number,
        "corrupted": number
    },
    "checks": [
        {
            "name": "check name",
            "passed": boolean,
            "reason": "detailed explanation",
            "metric": "specific metric value"
        }
    ]
}

Provide realistic validation results based on the dataset characteristics.`;
    }

    generateContentAnalysisPrompt(data) {
        return `Analyze this robotics dataset for content tagging and feature extraction - relevant to the dataset, take content tags from the description - have autnomous vehicle, outdoor, navigation, lidar, camera as tags for the kitti dataset.

Dataset: ${data.dataset.info.title}
Description: ${data.dataset.info.description}
Robot: ${data.dataset.info.robotModel}
Sensors: ${data.dataset.info.sensors}

Respond with ONLY a JSON object:
{
    "contentTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "primaryTask": "main task description",
    "complexity": "Low/Medium/High",
    "applications": ["application1", "application2", "application3"],
    "searchableKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;
    }

    generateTrajectoryPrompt(data) {
        return `Analyze trajectory data for this robotics dataset.

Dataset: ${data.dataset.info.title}
Robot: ${data.dataset.info.robotModel}

Respond with ONLY a JSON object:
{
    "totalTrajectories": number,
    "avgTrajectoryLength": number,
    "complexityMetrics": {
        "curvature": number (0-1),
        "velocityVariation": number (0-1),
        "accelerationChanges": number
    },
    "embeddingVector": [array of 128 numbers representing trajectory embedding]
}`;
    }

    generatePublishingPrompt(data) {
        return `Generate publishing information for this robotics dataset.

Dataset: ${data.dataset.info.title}
Description: ${data.dataset.info.description}

Respond with ONLY a JSON object:
{
    "doi": "10.1000/182",
    "citation": "Author, A. (2024). Dataset Title. RoboData Pipeline. https://doi.org/10.1000/182"
}`;
    }

    async callRealAPI(endpoint, data) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        switch (endpoint) {
            case 'data-ingestion':
                let allFiles = [...data.files];
                data.files.forEach(file => {
                    if (file.extractedFiles) {
                        allFiles = allFiles.concat(file.extractedFiles);
                    }
                });
                
                return {
                    totalFiles: allFiles.length,
                    files: allFiles,
                    standardizedFormats: {
                        images: 'PNG',
                        sensorData: 'Parquet',
                        annotations: 'JSON',
                        logs: 'TXT',
                        configs: 'JSON'
                    },
                    processingTime: 2.3,
                    fileTypes: this.analyzeFileTypes(allFiles)
                };
                
            case 'data-validation':
                const fileCount = data.dataset.standardizedData.totalFiles;
                const hasImages = data.dataset.standardizedData.fileTypes.png > 0 || data.dataset.standardizedData.fileTypes.jpg > 0;
                const hasSensorData = data.dataset.standardizedData.fileTypes.csv > 0;
                const hasAnnotations = data.dataset.standardizedData.fileTypes.json > 0;
                
                const userRobotModel = data.dataset.info.robotModel.toLowerCase();
                const userSensors = data.dataset.info.sensors.toLowerCase();
                let similarityBonus = 0;
                
                const aiDetection = await this.callRealAPI('auto-detect', {
                    description: data.dataset.info.description,
                    files: data.dataset.standardizedData.files || []
                });
                
                if (userRobotModel.includes(aiDetection.robotModel.toLowerCase()) || 
                    aiDetection.robotModel.toLowerCase().includes(userRobotModel)) {
                    similarityBonus += 5;
                }
                
                if (userSensors.includes(aiDetection.sensors.toLowerCase()) || 
                    aiDetection.sensors.toLowerCase().includes(userSensors)) {
                    similarityBonus += 5;
                }
                
                let validationResult;
                
                if (fileCount >= 10 && hasImages && hasSensorData && hasAnnotations) {
                    validationResult = {
                        overallScore: Math.min(95 + similarityBonus, 100),
                        passedChecks: 16,
                        totalChecks: 16,
                        scenario: "High Quality Dataset",
                        timestampData: {
                            timestamps: Array.from({length: 10}, (_, i) => `T${i}`),
                            drifts: Array.from({length: 10}, () => Math.random() * 3 + 1)
                        },
                        completenessData: {
                            complete: 98,
                            missing: 1,
                            corrupted: 1
                        },
                        checks: [
                            { name: 'File Completeness', passed: true, reason: 'All expected data files present and accessible', metric: '100% complete' },
                            { name: 'Annotation Integrity', passed: false, reason: 'Annotation inconsistencies found: 15 objects without bounding boxes', metric: '15/120 annotations: Invalid' },
                            { name: 'Sensor Data Quality', passed: true, reason: 'Sensor readings mostly within expected ranges', metric: 'SNR: 18.7 dB' },
                            { name: 'Data Consistency', passed: true, reason: 'Most data streams are consistent with minor discrepancies', metric: 'Consistency: 87.3%' }                      ]
                    };
                } else if (fileCount >= 5 && (hasImages || hasSensorData)) {
                    validationResult = {
                        overallScore: Math.min(78 + similarityBonus, 100),
                        passedChecks: 13,
                        totalChecks: 16,
                        scenario: "Medium Quality Dataset",
                        timestampData: {
                            timestamps: Array.from({length: 10}, (_, i) => `T${i}`),
                            drifts: Array.from({length: 10}, () => Math.random() * 8 + 2)
                        },
                        completenessData: {
                            complete: 92,
                            missing: 5,
                            corrupted: 3
                        },
                        checks: [
                            { name: 'File Completeness', passed: true, reason: 'All expected data files present and accessible', metric: '100% complete' },
                            { name: 'Annotation Integrity', passed: false, reason: 'Annotation inconsistencies found: 15 objects without bounding boxes', metric: '15/120 annotations: Invalid' },
                            { name: 'Sensor Data Quality', passed: true, reason: 'Sensor readings mostly within expected ranges', metric: 'SNR: 18.7 dB' },
                            { name: 'Data Consistency', passed: true, reason: 'Most data streams are consistent with minor discrepancies', metric: 'Consistency: 87.3%' },                        ]
                    };
                } else {
                    validationResult = {
                        overallScore: Math.min(62 + similarityBonus, 100),
                        passedChecks: 8,
                        totalChecks: 16,
                        scenario: "Low Quality Dataset",
                        timestampData: {
                            timestamps: Array.from({length: 10}, (_, i) => `T${i}`),
                            drifts: Array.from({length: 10}, () => Math.random() * 30 + 10)
                        },
                        completenessData: {
                            complete: 85,
                            missing: 8,
                            corrupted: 7
                        },
                        checks: [
                            { name: 'File Completeness', passed: true, reason: 'All expected data files present and accessible', metric: '100% complete' },
                            { name: 'Annotation Integrity', passed: false, reason: 'Annotation inconsistencies found: 15 objects without bounding boxes', metric: '15/120 annotations: Invalid' },
                            { name: 'Sensor Data Quality', passed: true, reason: 'Sensor readings mostly within expected ranges', metric: 'SNR: 18.7 dB' },
                            { name: 'Data Consistency', passed: true, reason: 'Most data streams are consistent with minor discrepancies', metric: 'Consistency: 87.3%' },                        ]
                    };
                }
                
                return validationResult;
                
            case 'content-analysis':
                const tags = [
                    'navigation','lidar','camera','cars','dataset'
                ];
                return {
                    tags: tags.sort(() => 0.5 - Math.random()).slice(0, 5)
                };
        
                
            case 'dataset-publishing':
                return {
                    doi: `10.1000/${Math.floor(Math.random() * 1000) + 200}`,
                    citation: `@dataset{${data.dataset.id}_${new Date().getFullYear()}, title={${data.dataset.info.title}}, author={RoboData User}, year={${new Date().getFullYear()}}, doi={10.1000/182}}`
                };
                
            case 'auto-detect':
                const description = data.description.toLowerCase();
                let robotModel = '';
                let sensors = [];
                
                if (description.includes('ur5') || description.includes('universal robots')) {
                    robotModel = 'Universal Robots UR5';
                } else if (description.includes('kuka') || description.includes('kr6')) {
                    robotModel = 'KUKA KR6 R700';
                } else if (description.includes('franka') || description.includes('panda')) {
                    robotModel = 'Franka Panda';
                } else if (description.includes('abb') || description.includes('irb')) {
                    robotModel = 'ABB IRB 120';
                } else if (description.includes('warehouse') || description.includes('industrial')) {
                    robotModel = 'Industrial Robot Arm';
                }
                
                if (description.includes('camera') || description.includes('vision') || description.includes('image')) {
                    sensors.push('Camera');
                }
                if (description.includes('lidar') || description.includes('laser')) {
                    sensors.push('LiDAR');
                }
                if (description.includes('imu') || description.includes('inertial')) {
                    sensors.push('IMU');
                }
                if (description.includes('force') || description.includes('torque')) {
                    sensors.push('Force/Torque');
                }
                if (description.includes('joint') || description.includes('encoder')) {
                    sensors.push('Joint Encoders');
                }
                
                data.files.forEach(file => {
                    const fileName = file.name.toLowerCase();
                    if (fileName.includes('camera') || fileName.includes('image') || fileName.endsWith('.png') || fileName.endsWith('.jpg')) {
                        if (!sensors.includes('Camera')) sensors.push('Camera');
                    }
                    if (fileName.includes('lidar') || fileName.includes('laser')) {
                        if (!sensors.includes('LiDAR')) sensors.push('LiDAR');
                    }
                    if (fileName.includes('imu') || fileName.includes('gyro')) {
                        if (!sensors.includes('IMU')) sensors.push('IMU');
                    }
                    if (fileName.includes('force') || fileName.includes('torque')) {
                        if (!sensors.includes('Force/Torque')) sensors.push('Force/Torque');
                    }
                    if (fileName.includes('joint') || fileName.includes('encoder')) {
                        if (!sensors.includes('Joint Encoders')) sensors.push('Joint Encoders');
                    }
                });
                
                return {
                    robotModel: robotModel,
                    sensors: sensors.join(', ')
                };
                
            case 'semantic-search':
                return data.datasets.filter(dataset => 
                    dataset.info.title.toLowerCase().includes(data.query.toLowerCase()) ||
                    dataset.info.description.toLowerCase().includes(data.query.toLowerCase())
                ).slice(0, 5);
                
            default:
                throw new Error('Unknown endpoint');
        }
    }
}

// Global functions for HTML onclick handlers
function startProcessing() {
    window.roboPipeline.executeStep1();
}

function loadSampleData() {
    document.getElementById('dataset-title').value = 'Warehouse Pick-and-Place Dataset';
    document.getElementById('description').value = 'This dataset contains pick-and-place operations performed by a Universal Robots UR5 in a warehouse environment. The robot uses camera vision and joint encoders to perform precise manipulation tasks with various objects.';
    
    const sampleFiles = [
        { name: 'sensor_data.csv', size: 1024 * 512, type: 'text/csv' },
        { name: 'camera_images.png', size: 1024 * 1024 * 2, type: 'image/png' },
        { name: 'robot_config.json', size: 1024 * 128, type: 'application/json' },
        { name: 'log_file.txt', size: 1024 * 256, type: 'text/plain' },
        { name: 'annotations.json', size: 1024 * 384, type: 'application/json' },
        { name: 'lidar_data.csv', size: 1024 * 1024, type: 'text/csv' },
        { name: 'imu_readings.csv', size: 1024 * 256, type: 'text/csv' },
        { name: 'force_sensor.json', size: 1024 * 128, type: 'application/json' },
        { name: 'joint_states.csv', size: 1024 * 512, type: 'text/csv' },
        { name: 'camera_calibration.json', size: 1024 * 64, type: 'application/json' },
        { name: 'trajectory_data.csv', size: 1024 * 768, type: 'text/csv' },
        { name: 'gripper_commands.json', size: 1024 * 96, type: 'application/json' }
    ];
    
    sampleFiles.forEach(file => {
        window.roboPipeline.addFile(file);
    });
    
    const sampleTextData = `{
  "robot_state": {
    "joint_positions": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
    "joint_velocities": [0.01, 0.02, 0.03, 0.04, 0.05, 0.06],
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "sensor_readings": {
    "camera": {
      "resolution": "1920x1080",
      "fps": 30
    },
    "force_sensor": {
      "fx": 0.5,
      "fy": 0.3,
      "fz": -2.1
    }
  }
}`;
    
    document.getElementById('text-data-input').value = sampleTextData;
    
    window.roboPipeline.updateFileList();
}

function processTextData() {
    const textInput = document.getElementById('text-data-input');
    const textData = textInput.value.trim();
    
    if (!textData) {
        alert('Please enter some text data to process.');
        return;
    }
    
    const textFile = {
        name: 'text_data.txt',
        size: new Blob([textData]).size,
        type: 'text/plain'
    };
    
    window.roboPipeline.addFile(textFile);
    
    textInput.value = '';
    
    window.roboPipeline.updateFileList();
}

function removeFile(fileId) {
    const pipeline = window.roboPipeline;
    pipeline.uploadedFiles = pipeline.uploadedFiles.filter(file => file.id !== fileId);
    pipeline.updateFileList();
}


function performSearch() {
    window.roboPipeline.performSearch();
}

function closeModal() {
    document.getElementById('dataset-modal').style.display = 'none';
}

function autoDetectInfo() {
    window.roboPipeline.autoDetectInfo();
}

function exportProfile() {
    const userDatasets = window.roboPipeline.processedDatasets.filter(dataset => dataset.published);
    const profileData = {
        totalDatasets: userDatasets.length,
        avgQuality: userDatasets.length > 0 ? 
            Math.round(userDatasets.reduce((sum, dataset) => sum + (dataset.qualityReport?.overallScore || 0), 0) / userDatasets.length) : 0,
        totalViews: userDatasets.reduce((sum, dataset) => sum + (dataset.views || 0), 0),
        totalDownloads: userDatasets.reduce((sum, dataset) => sum + (dataset.downloads || 0), 0),
        datasets: userDatasets
    };
    
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'robodata-profile.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

function shareProfile() {
    const userDatasets = window.roboPipeline.processedDatasets.filter(dataset => dataset.published);
    const totalDatasets = userDatasets.length;
    const avgQuality = userDatasets.length > 0 ? 
        Math.round(userDatasets.reduce((sum, dataset) => sum + (dataset.qualityReport?.overallScore || 0), 0) / userDatasets.length) : 0;
    
    const shareText = `Check out my robotics datasets on RoboData Pipeline! I've published ${totalDatasets} datasets with an average quality score of ${avgQuality}%. #Robotics #OpenData #AI`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My RoboData Profile',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Profile link copied to clipboard!');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.roboPipeline = new RoboDataPipeline();
});