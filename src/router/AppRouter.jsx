import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiscoveryGallery from '../components/DiscoveryGallery';
import MissionIntake from '../components/MissionIntake';
import InterviewView from '../components/InterviewView';
import DesignWorkspace from '../components/DesignWorkspace';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DiscoveryGallery />} />
        <Route path="/mission" element={<MissionIntake />} />
        <Route path="/interview" element={<InterviewView />} />
        <Route path="/design" element={<DesignWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}
