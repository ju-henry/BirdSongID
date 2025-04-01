import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BirdIdentifierApp = () => {
  const [recording, setRecording] = useState(null);
  const [identifiedBird, setIdentifiedBird] = useState(null);
  const [model, setModel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await loadTensorflowModel({
          url: require('./assets/model.tflite'),
        });
        setModel(loadedModel);
        console.log('Model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };
    loadModel();
  }, []);

  const processAudio = async (audioData) => {
    if (!model) {
      console.warn('Model not loaded yet');
      return null;
    }

    try {
      setIsProcessing(true);
      
      // For now, we'll use random input matching your model's requirements
      // In a real app, you would process the actual audio data here
      const inputData = new Float32Array(15600);
      for (let i = 0; i < inputData.length; i++) {
        inputData[i] = Math.random() * 2 - 1; // Random float between -1 and 1
      }

      // Run inference
      const result = await model.predict(inputData);
      const outputArray = Array.from(result);

      // Mock interpretation of results (replace with your actual logic)
      const birds = ['Robin', 'Sparrow', 'Blue Jay', 'Cardinal'];
      const confidenceScores = outputArray.slice(0, 4); // Assuming first 4 outputs are bird probabilities
      const maxIndex = confidenceScores.indexOf(Math.max(...confidenceScores));
      
      return birds[maxIndex];
    } catch (error) {
      console.error('Inference error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setRecording(undefined);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Read audio file (note: this gives base64, you might need to decode to PCM)
      const audioData = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });

      const bird = await processAudio(audioData);
      if (bird) {
        setIdentifiedBird(bird);
        
        // Save to AsyncStorage
        const date = new Date().toISOString();
        const location = 'Current Location';
        const newEntry = { name: bird, date, location };
        
        try {
          const existingEntriesJson = await AsyncStorage.getItem('birdEntries');
          let entries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
          entries.push(newEntry);
          await AsyncStorage.setItem('birdEntries', JSON.stringify(entries));
        } catch (error) {
          console.error('Error saving data:', error);
        }
      }
    } catch (error) {
      console.error('Error during recording stop:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
        disabled={isProcessing}
      />
      {isProcessing && <Text style={styles.status}>Processing audio...</Text>}
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
    padding: 20,
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 10,
    color: '#666',
  },
});

export default BirdIdentifierApp;
