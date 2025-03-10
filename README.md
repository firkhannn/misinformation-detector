
# FakeMeh??
![alt text](./frontend/public/FakemehMain.jpg)

## Mission Statement

**FakeMeh??** Fakemeh? is dedicated to empowering users with the tools to detect AI-generated misinformation by providing accurate deepfake analysis and interactive media literacy experiences. Through advanced AI detection, transparent visualizations, and gamified learning, Fakemeh? makes deepfake identification accessible, engaging, and educational. Our goal is to enhance digital awareness and critical thinking, ensuring a more informed and resilient online community.

## Features

- **Deepfake Detection**: Upload an image or URL to analyze AI manipulation likelihood using the SightEngine API.
- **Heatmap Visualization**: Highlights altered regions with MXFace API for better transparency.
- **Gamification**: Users guess if images are real or fake, earning badges, points, and streaks to promote media literacy.
- **User Progress Tracking**: A database stores achievements and rewards for a gamified experience, with leaderboard scoring.

- **Planned Enhancements**: Future updates include video deepfake detection, social sharing, and Google Fact Check API integration for better source verification.


## Target Audience

Fakemeh? is designed for a broad and inclusive audience, ensuring accessibility for users of all ages and technical backgrounds. Our primary users include:

- **Everyday Internet Users**: Anyone who wants to verify the authenticity of images and links to avoid misinformation.
- **Journalists & Fact-Checkers**: Professionals who require reliable deepfake detection tools to uphold media integrity.
- **Educators & Students**:  Individuals looking to enhance media literacy through interactive learning and gamification.
- **Content Creators & Researchers**: Those analyzing AI-generated content and seeking transparency in digital media.
- **Elderly Users**: Recognizing the challenges older individuals may face in identifying deepfakes, we have designed Fakemeh? with an intuitive, minimalist interface, high-contrast colors, and step-by-step tutorials to ensure ease of use.

## Project Video
https://youtu.be/G6iaiCnd0iM?feature=shared 

## Getting Started

To start using SmartCommute, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/misinformation-detector.git
   cd misinformation-detector

2. **Install Dependencies**: Navigate to both frontend and backend directories to install dependencies
   ```bash
   cd frontend
   npm install
   cd ../backend
   pip install -r requirements.txt
   npm install

3. **Set Up Environment Variables**: Create a `.env` file in both frontend and backend.


    ```makefile
    ## For backend .env:
    SIGHTENGINE_API_USER=your_sightengine_user
    SIGHTENGINE_API_SECRET=your_sightengine_secret
    GOOGLE_API_KEY=your_google_api_key
    MXFACE_API_KEY=your_mxface_api_key
    ```

4. **Run the Application**: Start both frontend and backend servers

    ```bash
    # Frontend
    cd frontend
    npm start
    ```

     ```bash
    # Backend
    cd backend
    python app.py
    ```
5. **Explore Features**:


## Technologies Used  
  <p>
    <img src="https://img.shields.io/badge/nodejs-8b0000?style=for-the-badge&logo=node" />
    <img src="https://img.shields.io/badge/javascript-096AB0?style=for-the-badge&logo=javascript" />
    <img src="https://img.shields.io/badge/python-096AB?style=for-the-badge&logo=python" />
    <img src="https://img.shields.io/badge/react-5b7700?style=for-the-badge&logo=react" />
    <img src="https://img.shields.io/badge/npm-8096Af?style=for-the-badge&logo=npm" />
    <img src="https://img.shields.io/badge/google_fact_checker-4285F4?style=for-the-badge&logo=google" />
    <img src="https://img.shields.io/badge/mxface-FF5733?style=for-the-badge&logo=mxface" />
    <img src="https://img.shields.io/badge/sight_engine-2C3E50?style=for-the-badge&logo=sightengine" />


  </p>   


## Contributors
- [@LeeZhengWee](https://github.com/LeeZhengWee)

- [@aliyyuraidhy](https://github.com/aliyyuraidhy)

- [@shenxh24](https://github.com/shenxh24)

- [@firkhannn](https://github.com/firkhannn)


