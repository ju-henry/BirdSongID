import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simulated bird sound identification algorithm
const identifyBird = (audioData) => {
  const birds = ['Robin', 'Sparrow', 'Blue Jay', 'Cardinal'];
  return birds[Math.floor(Math.random() * birds.length)];
};

const BirdIdentifierApp = () => {
  const [recording, setRecording] = useState(null);
  const [identifiedBird, setIdentifiedBird] = useState(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const audioData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    
    const bird = identifyBird(audioData);
    setIdentifiedBird(bird);
  
    // Save to AsyncStorage
    const date = new Date().toISOString();
    const location = 'Current Location';
    const newEntry = { name: bird, date, location };
    
    try {
      // Get existing entries
      const existingEntriesJson = await AsyncStorage.getItem('birdEntries');
      let entries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
      
      // Add new entry
      entries.push(newEntry);
      
      // Save updated entries
      await AsyncStorage.setItem('birdEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {identifiedBird && (
        <Text style={styles.result}>Identified Bird: {identifiedBird}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  result: {
    marginTop: 20,
    fontSize: 18,
  },
});

export default BirdIdentifierApp;
