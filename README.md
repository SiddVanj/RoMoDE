# RoMoDE: Robotics Multimodal Dataset Exchange

A modern web app for uploading, processing, searching, and demoing robotics datasets. No ROS bag, no cloud backend—just a browser-based experience for showcasing dataset features and search.

## Features

- **Upload any robotics data files**: ZIP, CSV, JSON, images, logs, etc.
- **Manual dataset info entry**: Title, robot model, sensors, environment, price, description
- **Drag-and-drop or file picker** for uploads
- **Automated pipeline**:
  1. Ingestion: Unpack and list files
  2. Quality Scoring: Simulated checks and dashboard
  3. Feature Extraction: Content tags and analysis
  4. Assemble & Publish: Demo dataset page, DOI, citation
- **Demo datasets**: Always available for search and profile
- **Semantic search**: Find datasets by keywords, robot, sensors, tags
- **Profile dashboard**: See your published datasets, stats, and export/share profile
- **Price support**: Set and display price for each dataset

## How It Works

1. **Upload Section**
   - Fill in dataset info (title, robot model, sensors, environment, price, description)
   - Upload files (any format)
   - Start the processing pipeline

2. **Processing Pipeline**
   - Step-by-step UI: Ingestion, Quality Scoring, Feature Extraction, Publishing
   - Quality check and AI analysis 
   - Dashboard and content tags

3. **Datasets & Search**
   - Demo datasets always shown
   - Search by content, robot, sensors, tags, price
   - View details for each dataset (including price)

4. **Profile**
   - See stats: datasets published, average quality, views, downloads
   - Export or share your profile data

## Usage

- Open `index.html` in your browser (no server required)
- Fill in dataset info and upload files
- Click "Start Processing Pipeline" to run the demo
- Use the search bar to find datasets
- View your profile for stats and published datasets

## Data Model

Each dataset includes:
- Title
- Robot Model
- Sensors
- Environment
- Price (USD)
- Description
- Uploaded files
- Quality score (simulated)
- Content tags (simulated)
- DOI and citation (simulated)
- Views and downloads (synthetic)

## Tech Stack
- HTML, CSS, JavaScript (ES6+)
- Chart.js for dashboard charts
- FontAwesome for icons

## Notes
- You would require at least 1 lidar point cloud file (could be .bin files too), for running main.py
- Replace "path0" in main.py to the directory pointing to the Lidar Point Cloud(s)


---
RoMoDE: A demo-ready robotics dataset platform for UI and search showcase.

