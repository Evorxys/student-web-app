import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "./components/handposeutil";
import * as fp from "fingerpose";
import Handsigns from "./components/handsigns";

import {
  Text,
  Heading,
  Button,
  Box,
  VStack,
  ChakraProvider,
  Input,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { RiCameraFill, RiCameraOffFill, RiRefreshFill } from "react-icons/ri";

// WebSocket setup
const SOCKET_URL = "ws://localhost:5000"; // Update with your WebSocket server URL

export default function Home() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null); // WebSocket ref

  const [camState, setCamState] = useState("on");
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = new WebSocket(SOCKET_URL);

    // Handle incoming WebSocket messages
    socketRef.current.onmessage = (event) => {
      const receivedMessage = `Teacher: ${event.data}`;
      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    };

    // Clean up WebSocket on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  async function runHandpose() {
    const net = await handpose.load();
    setInterval(() => {
      detect(net);
    }, 1000);
  }

  async function detect(net) {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hands = await net.estimateHands(video);

      if (hands.length > 0) {
        const GE = new fp.GestureEstimator([
          Handsigns.aSign,
          Handsigns.bSign,
          Handsigns.cSign,
          Handsigns.dSign,
          Handsigns.eSign,
          Handsigns.fSign,
          Handsigns.gSign,
          Handsigns.hSign,
          Handsigns.iSign,
          Handsigns.jSign,
          Handsigns.kSign,
          Handsigns.lSign,
          Handsigns.mSign,
          Handsigns.nSign,
          Handsigns.oSign,
          Handsigns.pSign,
          Handsigns.qSign,
          Handsigns.rSign,
          Handsigns.sSign,
          Handsigns.tSign,
          Handsigns.uSign,
          Handsigns.vSign,
          Handsigns.wSign,
          Handsigns.xSign,
          Handsigns.ySign,
          Handsigns.zSign,
        ]);

        const estimatedGestures = await GE.estimate(hands[0].landmarks, 6.5);
        console.log("Estimated Gestures:", estimatedGestures);

        if (estimatedGestures.gestures && estimatedGestures.gestures.length > 0) {
          const maxConfidenceGesture = estimatedGestures.gestures.reduce(
            (prev, current) => (prev.score > current.score ? prev : current),
            estimatedGestures.gestures[0]
          );

          if (maxConfidenceGesture && maxConfidenceGesture.name) {
            setDetectedGesture(maxConfidenceGesture.name);
            setInputText((prevText) => prevText + maxConfidenceGesture.name);
          }
        }
      }

      const ctx = canvasRef.current.getContext("2d");
      drawHand(hands, ctx);
    }
  }

  useEffect(() => {
    runHandpose();
  }, []);

  function turnOffCamera() {
    setCamState((prev) => (prev === "on" ? "off" : "on"));
  }

  function resetInput() {
    setInputText("");
  }

  function sendMessage() {
    if (inputText.trim()) {
      const message = `Student: ${inputText}`;
      setMessages((prevMessages) => [...prevMessages, message]);

      // Send message via WebSocket
      if (socketRef.current) {
        socketRef.current.send(inputText);
      }

      setInputText("");
    }
  }

  return (
    <ChakraProvider>
      <Box bgColor="#2D3748" height="100vh" color="white" p={5}>
        <VStack spacing={4} align="stretch" height="100%">
          <Heading as="h1" size="xl" textAlign="center">
            Hand Gesture Recognition
          </Heading>

          {/* Chat Box */}
          <Box
            bg="gray.700"
            borderRadius="md"
            p={4}
            flex={1}
            overflowY="auto"
            maxHeight={{ base: "200px", md: "300px" }} // Responsive height
            mb={4}
          >
            {messages.length === 0 ? (
              <Text>No messages yet.</Text>
            ) : (
              messages.map((msg, index) => (
                <Text key={index} mb={2}>
                  {msg}
                </Text>
              ))
            )}
          </Box>

          {/* Camera and Gesture Display */}
          <HStack justifyContent="center">
            <Box position="relative">
              {camState === "on" ? (
                <Webcam
                  ref={webcamRef}
                  style={{
                    width: "100%", // Full width for responsiveness
                    maxWidth: "320px", // Max width constraint
                    height: "auto", // Maintain aspect ratio
                  }}
                />
              ) : (
                <Box background="black" height="240px" width="100%" maxWidth="320px" />
              )}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  maxWidth: "320px",
                  height: "auto",
                }}
              />
            </Box>
          </HStack>

          <Text fontSize="lg" textAlign="center">
            Detected Gesture: {detectedGesture || "None"}
          </Text>

          {/* Input and Controls */}
          <HStack>
            <Input
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              flex={1}
              bg="gray.600"
              color="white"
            />
            <Button colorScheme="blue" onClick={sendMessage}>
              Send
            </Button>
            <IconButton
              icon={camState === "on" ? <RiCameraFill /> : <RiCameraOffFill />}
              onClick={turnOffCamera}
              colorScheme="orange"
              aria-label="Toggle Camera"
            />
            <IconButton
              icon={<RiRefreshFill />}
              colorScheme="green"
              aria-label="Reset"
              onClick={resetInput}
            />
          </HStack>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}
