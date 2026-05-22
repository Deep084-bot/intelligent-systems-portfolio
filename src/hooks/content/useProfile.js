/**
 * Hook: useProfile
 * Loads profile information and meta data
 */

import { useState, useEffect } from 'react';
import profileData from '../../data/profile.json';
import skillsData from '../../data/skills.json';
import achievementsData from '../../data/achievements.json';
import dsaStatsData from '../../data/dsa-stats.json';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [dsaStats, setDsaStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = () => {
      try {
        setProfile(profileData);
        setSkills(skillsData.skills || []);
        setAchievements(achievementsData.achievements || []);
        setDsaStats(dsaStatsData.dsa || null);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  return {
    profile,
    skills,
    achievements,
    dsaStats,
    loading,
    isEmpty: !profile,
  };
}

export default useProfile;
