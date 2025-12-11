import {
  GridLayout,
  ParticipantTile,
  useParticipants,
  useTracks,
  RoomAudioRenderer,
  useLocalParticipant,
  useMaybeRoomContext,
  useDataChannel,
  VideoTrack,
  AudioTrack,
  TrackRefContext,
  VideoConference,
} from "@livekit/components-react";
import { Track, Participant } from 'livekit-client';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Link,
  Check,
  Hand,
  Send,
  Volume2,
  Users,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isLocal: boolean;
}

export default function CustomConference({
  roomId,
  isHost,
  endCall,
  name
}: {
  roomId: string;
  isHost: boolean;
  endCall: () => void,
  name: string | null
}) {
  // Debug logging
  console.log('CustomConference props:', { roomId, isHost, name });
  const participants = useParticipants();
  const room = useMaybeRoomContext();
  const { localParticipant } = useLocalParticipant();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [activeReactions, setActiveReactions] = useState<{ id: number, emoji: string, x: number }[]>([]);
  const [participantHands, setParticipantHands] = useState<Record<string, boolean>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showSpeakerMenu, setShowSpeakerMenu] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [mutedParticipants, setMutedParticipants] = useState<Record<string, boolean>>({});
  const [allMuted, setAllMuted] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzersRef = useRef<Map<string, { analyzer: AnalyserNode, source?: MediaStreamAudioSourceNode }>>(new Map());
  const animationFrameRef = useRef<number>();
  const micMenuRef = useRef<HTMLDivElement>(null);
  const videoMenuRef = useRef<HTMLDivElement>(null);
  const speakerMenuRef = useRef<HTMLDivElement>(null);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Mobile resize listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatMessages, showChat]);

  // Beep player (simple oscillator) - used for join & hand raise
  const playBeep = (frequency = 880, duration = 120, volume = 0.06) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.value = volume;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        o.disconnect();
        g.disconnect();
      }, duration);
    } catch (e) {
      // ignore if audio disabled by browser
    }
  };

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      console.log('Starting device enumeration...');
      try {
        // Request permissions first to get device labels
        console.log('Requesting media permissions...');
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        console.log('Media permissions granted');
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('All devices:', devices);

        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

        console.log('Available audio devices:', audioInputs);
        console.log('Available video devices:', videoInputs);
        console.log('Available audio outputs:', audioOutputs);
        
        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);
        setSpeakerDevices(audioOutputs);

        // Set defaults (prefer currently set device if available)
        if (audioInputs.length > 0) {
          setSelectedMic(prev => prev || audioInputs[0].deviceId);
        }
        if (videoInputs.length > 0) {
          setSelectedCamera(prev => prev || videoInputs[0].deviceId);
        }
        if (audioOutputs.length > 0) {
          setSelectedSpeaker(prev => prev || audioOutputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading devices:', error);
        // Fallback: try to enumerate without permissions (will have limited labels)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          const videoInputs = devices.filter(device => device.kind === 'videoinput');
          const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
          
          setAudioDevices(audioInputs);
          setVideoDevices(videoInputs);
          setSpeakerDevices(audioOutputs);
        } catch (fallbackError) {
          console.error('Fallback device enumeration failed:', fallbackError);
        }
      }
    };

    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (micMenuRef.current && !micMenuRef.current.contains(event.target as Node)) {
        setShowMicMenu(false);
      }
      if (videoMenuRef.current && !videoMenuRef.current.contains(event.target as Node)) {
        setShowVideoMenu(false);
      }
      if (speakerMenuRef.current && !speakerMenuRef.current.contains(event.target as Node)) {
        setShowSpeakerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔥 CRITICAL: Enable audio/video when participant joins locally
  useEffect(() => {
    if (localParticipant) {
      try {
        console.log('Enabling audio and video for local participant');
        localParticipant.setMicrophoneEnabled(true);
        localParticipant.setCameraEnabled(true);
      } catch (e) {
        console.error('Error enabling local media by default', e);
      }
    }
  }, [localParticipant]);

  // Play beep when a new participant joins
  const prevParticipantsCountRef = useRef<number>(participants.length);
  useEffect(() => {
    const prev = prevParticipantsCountRef.current;
    if (participants.length > prev) {
      // someone joined
      playBeep(880, 130, 0.08);
    }
    prevParticipantsCountRef.current = participants.length;
  }, [participants.length]);

  // Play beep when hand is raised by someone (including local)
  const prevHandsRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const prev = prevHandsRef.current;
    // find differences
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(participantHands)]);
    //@ts-ignore
    for (const k of allKeys) {
      const oldVal = prev[k];
      const newVal = participantHands[k];
      if (!oldVal && newVal) {
        // raised
        playBeep(1200, 220, 0.08);
      } else if (oldVal && !newVal) {
        // lowered - smaller beep
        playBeep(700, 100, 0.04);
      }
    }
    prevHandsRef.current = { ...participantHands };
  }, [participantHands]);

  // Audio level monitoring & active speaker detection
  useEffect(() => {
    if (!room) return;

    // Initialize AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    let speakerThreshold = 0.15;
    let speakerTimeout: ReturnType<typeof setTimeout> | undefined;

    const updateAudioLevels = () => {
      const newLevels: Record<string, number> = {};
      let maxLevel = 0;
      let maxLevelParticipant: string | null = null;

      participants.forEach((participant) => {
        const identity = participant.identity;
        const audioTrack = participant.getTrackPublication(Track.Source.Microphone)?.track;

        if (audioTrack && audioTrack.mediaStreamTrack) {
          try {
            // Create analyzer if missing
            if (!analyzersRef.current.has(identity)) {
              const stream = new MediaStream([audioTrack.mediaStreamTrack]);
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const analyzer = audioContextRef.current!.createAnalyser();
              analyzer.fftSize = 256;
              analyzer.smoothingTimeConstant = 0.8;
              source.connect(analyzer);
              analyzersRef.current.set(identity, { analyzer, source });
            }

            const node = analyzersRef.current.get(identity);
            if (node) {
              const analyzer = node.analyzer;
              const dataArray = new Uint8Array(analyzer.frequencyBinCount);
              analyzer.getByteFrequencyData(dataArray);

              // Calculate average volume
              const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
              // Normalize to 0-1 range and apply threshold
              const normalizedLevel = Math.min(average / 128, 1);
              const level = normalizedLevel > 0.05 ? normalizedLevel : 0;
              newLevels[identity] = level;

              // Track highest audio level for active speaker
              if (level > maxLevel && level > speakerThreshold) {
                maxLevel = level;
                maxLevelParticipant = identity;
              }
            }
          } catch (error) {
            console.error('Error creating/getting analyzer:', error);
            newLevels[identity] = 0;
          }
        } else {
          newLevels[identity] = 0;
        }
      });

      setAudioLevels(newLevels);

      // Update active speaker with debounce
      if (maxLevelParticipant) {
        if (speakerTimeout) clearTimeout(speakerTimeout);
        setActiveSpeaker(maxLevelParticipant);
        speakerTimeout = setTimeout(() => {
          setActiveSpeaker(null);
        }, 2000);
      }

      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    };

    updateAudioLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speakerTimeout) clearTimeout(speakerTimeout);
      // disconnect analyzers
      analyzersRef.current.forEach(({ analyzer, source }) => {
        try {
          if (source) source.disconnect();
        } catch (e) {
          // ignore
        }
      });
      analyzersRef.current.clear();
    };
  }, [participants, room]);

  // Listen for data messages from other participants
  useDataChannel('reactions', (message) => {
    const decodedMessage = decoder.decode(message.payload);
    const data = JSON.parse(decodedMessage);

    if (data.type === 'reaction') {
      const id = Date.now() + Math.random();
      const x = Math.random() * 80 + 10;
      setActiveReactions(prev => [...prev, { id, emoji: data.emoji, x }]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    } else if (data.type === 'handRaise') {
      setParticipantHands(prev => ({
        ...prev,
        [data.participantId]: data.raised
      }));
    }
  });

  // Listen for admin commands
  useDataChannel('admin', (message) => {
    const decodedMessage = decoder.decode(message.payload);
    const data = JSON.parse(decodedMessage);

    if (data.type === 'muteAll') {
      // Only non-host participants should respond to mute all
      if (!isHost && localParticipant) {
        try {
          localParticipant.setMicrophoneEnabled(!data.muted);
          setIsMuted(data.muted);
        } catch (e) {
          console.error('Failed to respond to mute all command', e);
        }
      }
    } else if (data.type === 'muteParticipant') {
      // Only the targeted participant should respond
      if (!isHost && localParticipant && localParticipant.identity === data.participantId) {
        try {
          localParticipant.setMicrophoneEnabled(!data.muted);
          setIsMuted(data.muted);
        } catch (e) {
          console.error('Failed to respond to individual mute command', e);
        }
      }
    }
  });

  // Listen for chat messages
  useDataChannel('chat', (message) => {
    const decodedMessage = decoder.decode(message.payload);
    const data = JSON.parse(decodedMessage);

    if (data.type === 'chat') {
      const newMessage: ChatMessage = {
        id: data.id,
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        timestamp: data.timestamp,
        isLocal: false,
      };

      setChatMessages(prev => [...prev, newMessage]);

      if (!showChat) {
        setUnreadCount(prev => prev + 1);
      }
    }
  });

  // Get list of participants with raised hands
  const raisedHandParticipants = participants.filter(p => participantHands[p.identity]);

  const allTrackRefs = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Separate screen share tracks
  const screenShareTrack = allTrackRefs.find(
    trackRef => trackRef.source === Track.Source.ScreenShare && trackRef.publication !== undefined
  );

  // Camera tracks only (exclude screen share and audio)
  const cameraTrackRefs = allTrackRefs.filter(trackRef => {
    if (trackRef.source === Track.Source.Microphone) return false;
    if (trackRef.source === Track.Source.ScreenShare) return false;
    return true;
  });

  // Build a map participant.identity -> camera trackRef for stable lookups (fixes black video)
  const cameraTrackMap = useMemo(() => {
    const m = new Map<string, any>();
    cameraTrackRefs.forEach((tr) => {
      if (tr.participant && tr.participant.identity) {
        m.set(tr.participant.identity, tr);
      }
    });
    return m;
  }, [cameraTrackRefs]);

  // Sort participants: local first, then active speaker, then others
  const sortedParticipants = useMemo(() => {
    const sorted = [...participants];
    sorted.sort((a, b) => {
      // Local participant always first
      if (a.isLocal) return -1;
      if (b.isLocal) return 1;

      // Active speaker second
      if (a.identity === activeSpeaker) return -1;
      if (b.identity === activeSpeaker) return 1;

      // Sort by audio level (higher first)
      const aLevel = audioLevels[a.identity] || 0;
      const bLevel = audioLevels[b.identity] || 0;
      return bLevel - aLevel;
    });
    return sorted;
  }, [participants, activeSpeaker, audioLevels]);

  const toggleAudio = () => {
    if (localParticipant) {
      const newMutedState = !isMuted;
      try {
        localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMuted(newMutedState);
        console.log('Audio toggled - Muted:', newMutedState);
      } catch (e) {
        console.error('toggleAudio failed', e);
      }
    }
  };

  const toggleVideo = () => {
    if (localParticipant) {
      const newVideoOffState = !isVideoOff;
      try {
        localParticipant.setCameraEnabled(!newVideoOffState);
        setIsVideoOff(newVideoOffState);
        console.log('Video toggled - Off:', newVideoOffState);
      } catch (e) {
        console.error('toggleVideo failed', e);
      }
    }
  };

  const switchMicrophone = async (deviceId: string) => {
    if (localParticipant && room) {
      try {
        console.log('Attempting to switch to microphone:', deviceId);
        
        // First, try to get access to the specific device
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            deviceId: { exact: deviceId } 
          } 
        });
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        // Now switch the active device in LiveKit
        await room.switchActiveDevice('audioinput', deviceId);
        
        // Update state
        setSelectedMic(deviceId);
        setShowMicMenu(false);
        
        console.log('Successfully switched to microphone:', deviceId);
        
        // Ensure microphone is enabled after switching
        if (localParticipant.isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(false);
          await localParticipant.setMicrophoneEnabled(true);
        }
        
      } catch (error) {
        console.error('Error switching microphone:', error);
        alert(`Could not switch to selected microphone. Error: ${(error as any)?.message}`);
      }
    } else {
      console.error('LocalParticipant or room not available for microphone switch');
      alert('Cannot switch microphone - not connected to room');
    }
  };

  const switchCamera = async (deviceId: string) => {
    if (localParticipant && room) {
      try {
        try {
          await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
        } catch (err) {
          console.warn('getUserMedia fallback failed for device', deviceId, err);
        }
        await room.switchActiveDevice('videoinput', deviceId);
        try {
          await localParticipant.setCameraEnabled(true);
        } catch (e) {
          console.warn('Could not ensure camera enabled after switch', e);
        }
        setSelectedCamera(deviceId);
        setShowVideoMenu(false);
        console.log('Switched to camera:', deviceId);
      } catch (error) {
        console.error('Error switching camera:', error);
        alert('Could not switch camera. See console for details.');
      }
    } else {
      alert('Room or local participant not available yet.');
    }
  };

  const switchSpeaker = async (deviceId: string) => {
    if (room) {
      try {
        await room.switchActiveDevice('audiooutput', deviceId);
        setSelectedSpeaker(deviceId);
        setShowSpeakerMenu(false);
        console.log('Switched speaker:', deviceId);
      } catch (error) {
        console.error('Error switching speaker:', error);
        alert('Could not switch speaker device. See console for details.');
      }
    }
  };

  const shareScreen = async () => {
    if (localParticipant) {
      try {
        // Check if we're on mobile and handle accordingly
        if (isMobile) {
          // On mobile, we need to request screen capture with specific constraints
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { max: 1920 },
              height: { max: 1080 },
              frameRate: { max: 15 }
            },
            audio: false // Audio sharing often causes issues on mobile
          });
          
          // Enable screen share with the obtained stream
          await localParticipant.setScreenShareEnabled(true);
        } else {
          await localParticipant.setScreenShareEnabled(true);
        }
      } catch (error) {
        console.error('Screen sharing failed:', error);
        alert('Screen sharing is not supported on this device or browser.');
      }
    }
  };

  // Admin functions for muting participants
  const muteAllParticipants = () => {
    if (!isHost) return;
    
    const message = JSON.stringify({
      type: 'muteAll',
      muted: true
    });
    const data = encoder.encode(message);
    
    if (room) {
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'admin' });
        setAllMuted(true);
      } catch (e) {
        console.error('Failed to mute all participants', e);
      }
    }
  };

  const unmuteAllParticipants = () => {
    if (!isHost) return;
    
    const message = JSON.stringify({
      type: 'muteAll',
      muted: false
    });
    const data = encoder.encode(message);
    
    if (room) {
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'admin' });
        setAllMuted(false);
        setMutedParticipants({});
      } catch (e) {
        console.error('Failed to unmute all participants', e);
      }
    }
  };

  const muteParticipant = (participantId: string) => {
    if (!isHost) return;
    
    const message = JSON.stringify({
      type: 'muteParticipant',
      participantId,
      muted: true
    });
    const data = encoder.encode(message);
    
    if (room) {
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'admin' });
        setMutedParticipants(prev => ({ ...prev, [participantId]: true }));
      } catch (e) {
        console.error('Failed to mute participant', e);
      }
    }
  };

  const unmuteParticipant = (participantId: string) => {
    if (!isHost) return;
    
    const message = JSON.stringify({
      type: 'muteParticipant',
      participantId,
      muted: false
    });
    const data = encoder.encode(message);
    
    if (room) {
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'admin' });
        setMutedParticipants(prev => {
          const updated = { ...prev };
          delete updated[participantId];
          return updated;
        });
      } catch (e) {
        console.error('Failed to unmute participant', e);
      }
    }
  };

  const copyRoomLink = async () => {
    const roomUrl = `${window.location.origin}${window.location.pathname}?roomId=${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const toggleHandRaise = () => {
    const newHandRaisedState = !handRaised;
    setHandRaised(newHandRaisedState);

    if (localParticipant && room) {
      const message = JSON.stringify({
        type: 'handRaise',
        participantId: localParticipant.identity,
        raised: newHandRaisedState
      });
      const data = encoder.encode(message);
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'reactions' });
      } catch (e) {
        console.error('publishData handRaise failed', e);
      }
    }

    if (localParticipant) {
      setParticipantHands(prev => ({
        ...prev,
        [localParticipant.identity]: newHandRaisedState
      }));
    }

    if (newHandRaisedState) {
      playBeep(1200, 220, 0.08);
    } else {
      playBeep(700, 100, 0.04);
    }
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now();
    const x = Math.random() * 80 + 10;
    setActiveReactions(prev => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);

    setShowReactions(false);

    if (room) {
      const message = JSON.stringify({
        type: 'reaction',
        emoji: emoji
      });
      const data = encoder.encode(message);
      try {
        room.localParticipant.publishData(data, { reliable: true, topic: 'reactions' });
      } catch (e) {
        console.error('publishData reaction failed', e);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !localParticipant || !room) return;

    const messageId = `${Date.now()}-${Math.random()}`;
    const newMessage: ChatMessage = {
      id: messageId,
      senderId: localParticipant.identity,
      senderName: localParticipant.name || 'Guest',
      message: chatInput.trim(),
      timestamp: Date.now(),
      isLocal: true,
    };

    setChatMessages(prev => [...prev, newMessage]);

    const message = JSON.stringify({
      type: 'chat',
      id: messageId,
      senderId: localParticipant.identity,
      senderName: localParticipant.name || 'Guest',
      message: chatInput.trim(),
      timestamp: Date.now(),
    });
    const data = encoder.encode(message);
    try {
      room.localParticipant.publishData(data, { reliable: true, topic: 'chat' });
    } catch (e) {
      console.error('publishData chat failed', e);
    }

    setChatInput('');
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const endSessionForAll = async () => {
    if (confirm('Are you sure you want to end the session for everyone?')) {
      await fetch(`/api/token?roomId=${roomId}`, {
        method: "DELETE",
      });
      endCall();
    }
  };

  const leaveRoom = () => {
    if (room) {
      room.disconnect();
    }
  };

  // Audio Visualizer Component - Static bars with fill based on level
  const AudioVisualizer = ({ level }: { level: number }) => {
    const bars = 5;
    const barHeights = [60, 80, 100, 80, 60]; // Static wave pattern

    return (
      <div className="flex items-center gap-0.5 h-6">
        {Array.from({ length: bars }).map((_, i) => {
          const fillPercentage = Math.min(100, level * 300); // Amplify the level

          return (
            <div
              key={i}
              className="w-1 bg-gray-600 rounded-full relative overflow-hidden"
              style={{ height: `${barHeights[i]}%` }}
            >
              <div
                className="absolute bottom-0 w-full bg-green-500 transition-all duration-150 rounded-full"
                style={{ height: `${fillPercentage}%` }}
              />
            </div>
          );
        })}
      </div>
    );
  };


  // Native video fallback component
  const NativeVideoFallback = ({ mediaStreamTrack, isLocal }: { mediaStreamTrack: MediaStreamTrack, isLocal: boolean }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
      if (!videoRef.current) return;
      const videoEl = videoRef.current;
      let stream: MediaStream | null = null;
      try {
        stream = new MediaStream([mediaStreamTrack]);
        videoEl.srcObject = stream;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        if (isLocal) {
          // local preview must be muted for autoplay policies
          videoEl.muted = true;
        }
        // try to play (some browsers require a user gesture; mute helps)
        videoEl.play().catch(err => {
          console.debug('video play() failed on fallback:', err);
        });
      } catch (e) {
        console.error('NativeVideoFallback error:', e);
      }
      return () => {
        try {
          if (videoEl) {
            videoEl.pause();
            videoEl.srcObject = null;
          }
          if (stream) {
            stream.getTracks().forEach(t => {
              if (t !== mediaStreamTrack) {
                try { t.stop(); } catch {}
              }
            });
            stream = null;
          }
        } catch (e) {
          // ignore cleanup errors
        }
      };
    }, [mediaStreamTrack, isLocal]);

    return <video ref={videoRef} className="w-full h-full object-cover" />;
  };

  // Custom Participant Tile Component with robust fallback and avatar-on-camera-off behavior
  const CustomParticipantTile = ({ participant, isMain = false, cameraTrackRef }: { participant: Participant, isMain?: boolean, cameraTrackRef?: any }) => {
    const audioLevel = audioLevels[participant.identity] || 0;
    const isSpeaking = audioLevel > 0.15;
    const isActiveSpeaker = activeSpeaker === participant.identity;
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {}

    // Determine whether underlying MediaStreamTrack exists
    const mediaStreamTrack: MediaStreamTrack | null = cameraTrackRef?.publication?.track?.mediaStreamTrack || cameraTrackRef?.track?.mediaStreamTrack || null;

    // Determine if camera is considered "on"
    // participant.isCameraEnabled is commonly available; if not, fallback to checking mediaStreamTrack.enabled
    const participantCameraEnabled = typeof (participant as any).isCameraEnabled === 'boolean'
      ? (participant as any).isCameraEnabled
      : (mediaStreamTrack ? (mediaStreamTrack.enabled ?? true) : false);

    const showAvatar = !participantCameraEnabled || !mediaStreamTrack;

    return (
      <div
        className={`relative bg-gray-800 rounded-lg overflow-hidden ${isActiveSpeaker ? 'ring-4 ring-green-500' : isSpeaking ? 'ring-2 ring-green-400' : ''
          } ${isMain ? 'h-full' : ''}`}
      >
        {/* If the participant camera is off or there is no usable track, show avatar */}
        {showAvatar ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold">
              {metadata.name?.[0]?.toUpperCase() || participant.name?.[0]?.toUpperCase() || 'G'}
            </div>
          </div>
        ) : (
          // Camera is on and we have a track: prefer LiveKit VideoTrack with a native fallback
          <>
            {cameraTrackRef && cameraTrackRef.publication ? (
              <TrackRefContext.Provider value={cameraTrackRef}>
                <VideoTrack className="w-full h-full object-cover" />
              </TrackRefContext.Provider>
            ) : null}

            {!cameraTrackRef?.publication && mediaStreamTrack ? (
              <NativeVideoFallback mediaStreamTrack={mediaStreamTrack} isLocal={participant.isLocal} />
            ) : null}

            {cameraTrackRef?.publication && mediaStreamTrack && (
              // render native fallback behind VideoTrack to show if VideoTrack fails
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <NativeVideoFallback mediaStreamTrack={mediaStreamTrack} isLocal={participant.isLocal} />
              </div>
            )}
          </>
        )}

        {/* Participant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">
                {metadata.role}
                {participant.isLocal && ' (You)'}
              </span>
              {participantHands[participant.identity] && (
                <span className="text-lg">✋</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AudioVisualizer level={audioLevel} />
              {!participant.isMicrophoneEnabled && (
                <MicOff size={16} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Active Speaker Indicator */}
        {isActiveSpeaker && (
          <div className="absolute top-3 right-3 bg-green-500 px-2 py-1 rounded text-xs font-semibold">
            Speaking
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen md:pb-0 bg-gray-900 text-white relative">
      {/* Floating Reactions */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-20 animate-float-up text-6xl"
            style={{
              left: `${reaction.x}%`,
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-50px) scale(1);
          }
          100% {
            transform: translateY(-600px) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
          </span>
          {raisedHandParticipants.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600 rounded-lg">
              <Hand size={14} />
              <span className="text-xs font-medium">{raisedHandParticipants.length}</span>
            </div>
          )}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            title="Copy meeting link"
          >
            {linkCopied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Link size={16} />
                Copy Link
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              console.log('Debug button clicked from header');
              setShowDebugPanel(!showDebugPanel);
              // Also open participants panel if it's closed
              if (!showParticipants) {
                setShowParticipants(true);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showDebugPanel 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title="Toggle debug panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Debug
          </button>
        </div>
      </div>

      {/* Floating Debug Panel - Independent of participants sidebar */}
      {showDebugPanel && !showParticipants && (
        <div className="fixed top-20 right-4 w-80 bg-gray-800 rounded-lg border-2 border-purple-500 p-4 z-[99999] shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-purple-400">🐛 Debug Information</h4>
            <button 
              onClick={() => setShowDebugPanel(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="text-xs space-y-1">
            <div>Is Host: <span className="text-green-400">{isHost ? 'Yes' : 'No'}</span></div>
            <div>Participants: <span className="text-blue-400">{participants.length}</span></div>
            <div>Local Participant: <span className="text-yellow-400">{localParticipant?.identity || 'None'}</span></div>
            <div>Audio Devices: <span className="text-cyan-400">{audioDevices.length}</span></div>
            <div>Show Mic Menu: <span className="text-pink-400">{showMicMenu ? 'Yes' : 'No'}</span></div>
            <div>Selected Mic: <span className="text-orange-400">{selectedMic || 'None'}</span></div>
            <div>Participants Panel: <span className="text-red-400">{showParticipants ? 'Open' : 'Closed'}</span></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button 
              onClick={() => {
                console.log('Force toggle mic menu from floating debug');
                setShowMicMenu(!showMicMenu);
              }}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
            >
              Toggle Mic Menu
            </button>
            <button 
              onClick={async () => {
                console.log('Refreshing devices from floating debug...');
                try {
                  const devices = await navigator.mediaDevices.enumerateDevices();
                  const audioInputs = devices.filter(d => d.kind === 'audioinput');
                  console.log('Audio devices found:', audioInputs);
                  setAudioDevices(audioInputs);
                } catch (e) {
                  console.error('Device enumeration failed:', e);
                }
              }}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
            >
              Refresh Devices
            </button>
            <button 
              onClick={() => {
                setShowParticipants(true);
              }}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs"
            >
              Open Participants
            </button>
          </div>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-hidden">
          {screenShareTrack ? (
            // Screen share mode: Large screen share + small participant grid
            <div className="h-full flex gap-4">
              <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                <TrackRefContext.Provider value={screenShareTrack}>
                  <VideoTrack className="w-full h-full object-contain" />
                </TrackRefContext.Provider>
              </div>
              <div className="w-64 overflow-y-auto space-y-2">
                {sortedParticipants.map((participant) => (
                  <div key={participant.identity} className="h-36">
                    <CustomParticipantTile
                      participant={participant}
                      cameraTrackRef={cameraTrackMap.get(participant.identity)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <VideoConference  />
          )}

          {/* RoomAudioRenderer MUST be outside GridLayout */}
          <RoomAudioRenderer />
        </div>

        {/* Sidebar - Participants */}
        {showParticipants && (
          <div className={`${isMobile ? 'fixed top-0 right-0 z-50 w-full h-full pb-20' : 'w-80'} ${isMobile ? 'bg-gray-900' : 'bg-gray-800'} border-l border-gray-700 p-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Participants ({participants.length})
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white"
                  title="Toggle debug panel"
                >
                  Debug
                </button>
                {isMobile && (
                  <button onClick={() => setShowParticipants(false)} className="text-sm px-2 py-1 bg-gray-700 rounded">Close</button>
                )}
              </div>
            </div>

            {/* Debug Panel - Toggleable */}
            {showDebugPanel && (
              <div className="mb-4 p-3 bg-gray-800 rounded border border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-400">Debug Information</h4>
                  <button 
                    onClick={() => setShowDebugPanel(false)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs space-y-1">
                  <div>Is Host: <span className="text-green-400">{isHost ? 'Yes' : 'No'}</span></div>
                  <div>Participants: <span className="text-blue-400">{participants.length}</span></div>
                  <div>Local Participant: <span className="text-yellow-400">{localParticipant?.identity || 'None'}</span></div>
                  <div>Audio Devices: <span className="text-cyan-400">{audioDevices.length}</span></div>
                  <div>Show Mic Menu: <span className="text-pink-400">{showMicMenu ? 'Yes' : 'No'}</span></div>
                  <div>Selected Mic: <span className="text-orange-400">{selectedMic || 'None'}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      console.log('Force toggle mic menu');
                      setShowMicMenu(!showMicMenu);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                  >
                    Toggle Mic Menu
                  </button>
                  <button 
                    onClick={async () => {
                      console.log('Refreshing devices...');
                      try {
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const audioInputs = devices.filter(d => d.kind === 'audioinput');
                        console.log('Audio devices found:', audioInputs);
                        setAudioDevices(audioInputs);
                      } catch (e) {
                        console.error('Device enumeration failed:', e);
                      }
                    }}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
                  >
                    Refresh Devices
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Current state:', {
                        showMicMenu,
                        showVideoMenu,
                        showSpeakerMenu,
                        audioDevices: audioDevices.length,
                        selectedMic
                      });
                    }}
                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs"
                  >
                    Log State
                  </button>
                </div>
              </div>
            )}

            {/* Admin Controls */}
            {isHost && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-600/50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Host Controls</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={allMuted ? unmuteAllParticipants : muteAllParticipants}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      allMuted 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {allMuted ? 'Unmute All' : 'Mute All'}
                  </button>
                </div>
              </div>
            )}

            {/* Fallback Admin Controls - Always show for debugging */}
            {!isHost && (
              <div className="mb-4 p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-3">Debug: Not Host</h4>
                <p className="text-xs text-gray-400">If you should be host, check URL parameters</p>
              </div>
            )}

            {raisedHandParticipants.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                  <Hand size={16} />
                  Raised Hands ({raisedHandParticipants.length})
                </h4>
                <div className="space-y-2">
                  {raisedHandParticipants.map((participant) => {
                     const metadata = participant.metadata ? JSON.parse(participant.metadata) : {}
                    return (
                    <div
                      key={participant.identity}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-yellow-400">✋</span>
                      <span>{metadata.role}</span>
                      {participant.isLocal && (
                        <span className="text-xs text-blue-400">(You)</span>
                      )}
                    </div>
                  )})}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {sortedParticipants.map((participant) => {
                const audioLevel = audioLevels[participant.identity] || 0;
                const isSpeaking = audioLevel > 0.05;
                const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
                const isParticipantMuted = mutedParticipants[participant.identity] || !participant.isMicrophoneEnabled;

                return (
                  <div
                    key={participant.identity}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isSpeaking
                      ? 'bg-green-900/30 border-2 border-green-600'
                      : 'bg-gray-700 border-2 border-transparent'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isSpeaking ? 'bg-green-600 ring-2 ring-green-400' : 'bg-blue-600'
                      }`}>
                      {metadata.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {metadata.name || 'Guest'}
                        {participantHands[participant.identity] && (
                          <span className="ml-2">✋</span>
                        )}
                        {isParticipantMuted && (
                          <MicOff size={12} className="inline ml-2 text-red-400" />
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <AudioVisualizer level={audioLevel} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {participant.isLocal && (
                        <span className="text-xs text-blue-400">(You)</span>
                      )}
                      
                      {/* Host controls for other participants */}
                      {isHost && !participant.isLocal && (
                        <button
                          onClick={() => 
                            isParticipantMuted 
                              ? unmuteParticipant(participant.identity)
                              : muteParticipant(participant.identity)
                          }
                          className={`p-1 rounded text-xs transition-colors ${
                            isParticipantMuted
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title={isParticipantMuted ? 'Unmute participant' : 'Mute participant'}
                        >
                          {isParticipantMuted ? <Mic size={12} /> : <MicOff size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sidebar - Chat */}
        {showChat && (
          <div className={`${isMobile ? 'fixed top-0 right-0 z-50 w-full h-full pb-20' : 'w-80'} ${isMobile ? 'bg-gray-900' : 'bg-gray-800'} border-l border-gray-700 flex flex-col`}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">In-call messages</h3>
                <p className="text-xs text-gray-400 mt-1">Messages can only be seen by people in the call</p>
              </div>
              {isMobile && <button onClick={() => setShowChat(false)} className="text-sm px-2 py-1 bg-gray-700 rounded">Close</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={48} className="text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No messages yet</p>
                  <p className="text-xs text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isLocal ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${msg.isLocal ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                        {msg.senderName[0]?.toUpperCase() || 'G'}
                      </div>

                      <div className={`flex-1 ${msg.isLocal ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${msg.isLocal ? 'text-blue-400' : 'text-gray-300'}`}>
                            {msg.isLocal ? 'You' : msg.senderName}
                          </span>
                          <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        <div className={`rounded-lg px-3 py-2 max-w-full break-words ${msg.isLocal
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                          }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Send a message to everyone"
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className={`px-4 py-3 ${isMobile ? 'pb-6' : 'px-6 py-4'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'} max-w-7xl mx-auto`}>
          {/* Left side - Audio Visualizer - Fixed width to prevent movement */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-400 w-48">
            <div className="hidden md:flex items-center gap-2">
              {localParticipant && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
                  <AudioVisualizer
                    level={audioLevels[localParticipant.identity] || 0}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Center - Main controls */}
          <div className={`flex ${isMobile ? 'flex-wrap justify-center' : 'justify-center items-center'} gap-2 ${isMobile ? 'w-full' : 'w-full mx-auto'}`}>
            {/* Audio with dropdown */}
            <div className="relative" ref={micMenuRef}>
              <div className="flex">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`${isMobile ? 'p-3' : 'p-4'} rounded-l-lg transition-colors ${isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={isMobile ? 18 : 20} /> : <Mic size={isMobile ? 18 : 20} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Mic dropdown clicked, current state:', showMicMenu);
                    setShowMicMenu(!showMicMenu);
                  }}
                  className={`${isMobile ? 'px-2 py-3' : 'px-2 py-4'} rounded-r-lg border-l border-gray-600 transition-colors ${
                    showMicMenu 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : isMuted
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  title="Select microphone"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L2 4h8L6 8z" />
                  </svg>
                </button>
              </div>
              {showMicMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-[99998]" 
                    onClick={() => setShowMicMenu(false)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                  />
                  {/* Dropdown */}
                  <div 
                    className={`fixed ${isMobile ? 'bottom-20 left-1/2 transform -translate-x-1/2 w-80' : 'bottom-20 left-4 w-72'} bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500 py-2 z-[99999] max-h-60 overflow-y-auto`}
                    style={{ 
                      position: 'fixed',
                      zIndex: 99999,
                      backgroundColor: '#1f2937',
                      border: '2px solid #3b82f6'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                  <div className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 border-b border-gray-700 flex items-center justify-between">
                    <span>🎤 SELECT MICROPHONE</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            console.log('Refreshing microphone devices...');
                            await navigator.mediaDevices.getUserMedia({ audio: true });
                            const devices = await navigator.mediaDevices.enumerateDevices();
                            const audioInputs = devices.filter(device => device.kind === 'audioinput');
                            console.log('Found audio inputs:', audioInputs);
                            setAudioDevices(audioInputs);
                          } catch (error) {
                            console.error('Failed to refresh devices:', error);
                          }
                        }}
                        className="text-xs text-white hover:text-blue-200"
                        title="Refresh devices"
                      >
                        ↻
                      </button>
                      <button
                        onClick={() => setShowMicMenu(false)}
                        className="text-xs text-white hover:text-red-300"
                        title="Close menu"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2 text-xs text-yellow-300 bg-gray-900">
                    DEBUG: Dropdown is visible! State: {showMicMenu ? 'OPEN' : 'CLOSED'}
                  </div>
                  {audioDevices.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      <div>No microphones found</div>
                      <div className="text-xs mt-1">Try refreshing or check permissions</div>
                    </div>
                  ) : (
                    <>
                      <div className="px-3 py-1 text-xs text-gray-500">
                        Found {audioDevices.length} device(s)
                      </div>
                      {audioDevices.map((device, index) => {
                        const deviceName = device.label || `Microphone ${index + 1}`;
                        const isSelected = selectedMic === device.deviceId;
                        
                        return (
                          <button
                            key={device.deviceId}
                            type="button"
                            onClick={() => switchMicrophone(device.deviceId)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                              isSelected ? 'text-blue-400 bg-blue-900/30' : 'text-white'
                            }`}
                            title={`Device ID: ${device.deviceId}`}
                          >
                            {isSelected && (
                              <Check size={16} className="text-blue-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{deviceName}</div>
                              {device.label && (
                                <div className="text-xs text-gray-400 truncate">
                                  ID: {device.deviceId.slice(0, 8)}...
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                  </div>
                </>
              )}
            </div>

            {/* Video with dropdown */}
            <div className="relative" ref={videoMenuRef}>
              <div className="flex">
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`${isMobile ? 'p-3' : 'p-4'} rounded-l-lg transition-colors ${isVideoOff
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  title={isVideoOff ? 'Start Video' : 'Stop Video'}
                >
                  {isVideoOff ? <VideoOff size={isMobile ? 18 : 20} /> : <Video size={isMobile ? 18 : 20} />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoMenu(!showVideoMenu)}
                  className={`${isMobile ? 'px-2 py-3' : 'px-2 py-4'} rounded-r-lg border-l border-gray-600 transition-colors ${isVideoOff
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  title="Select camera"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L2 4h8L6 8z" />
                  </svg>
                </button>
              </div>

              {showVideoMenu && (
                <div 
                  className={`fixed ${isMobile ? 'bottom-20 left-1/2 transform -translate-x-1/2 w-80' : 'bottom-20 left-20 w-72'} bg-gray-800 rounded-lg shadow-2xl border-2 border-green-500 py-2 z-[99999] max-h-60 overflow-y-auto`}
                  style={{ 
                    position: 'fixed',
                    zIndex: 99999,
                    backgroundColor: '#1f2937',
                    border: '2px solid #10b981'
                  }}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">
                    SELECT CAMERA
                  </div>
                  {videoDevices.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No cameras found</div>
                  ) : (
                    videoDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => switchCamera(device.deviceId)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${selectedCamera === device.deviceId ? 'text-blue-400' : 'text-white'
                          }`}
                      >
                        {selectedCamera === device.deviceId && (
                          <Check size={16} className="text-blue-400" />
                        )}
                        <span className="truncate">{device.label || `Camera ${device.deviceId.slice(0, 5)}`}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Speaker Selection */}
            <div className="relative" ref={speakerMenuRef}>
              <button
                type="button"
                onClick={() => setShowSpeakerMenu(!showSpeakerMenu)}
                className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors`}
                title="Select speaker"
              >
                <Volume2 size={isMobile ? 18 : 20} />
              </button>

              {showSpeakerMenu && (
                <div 
                  className={`fixed ${isMobile ? 'bottom-20 left-1/2 transform -translate-x-1/2 w-80' : 'bottom-20 left-36 w-72'} bg-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 py-2 z-[99999] max-h-60 overflow-y-auto`}
                  style={{ 
                    position: 'fixed',
                    zIndex: 99999,
                    backgroundColor: '#1f2937',
                    border: '2px solid #8b5cf6'
                  }}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">
                    SELECT SPEAKER
                  </div>
                  {speakerDevices.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No speakers found</div>
                  ) : (
                    speakerDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => switchSpeaker(device.deviceId)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 ${selectedSpeaker === device.deviceId ? 'text-blue-400' : 'text-white'
                          }`}
                      >
                        {selectedSpeaker === device.deviceId && (
                          <Check size={16} className="text-blue-400" />
                        )}
                        <span className="truncate">{device.label || `Speaker ${device.deviceId.slice(0, 5)}`}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Screen Share */}
            <button
              type="button"
              onClick={shareScreen}
              className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors`}
              title="Share Screen"
            >
              <MonitorUp size={isMobile ? 18 : 20} />
            </button>

            {/* Participants */}
            <button
              type="button"
              onClick={() => setShowParticipants(!showParticipants)}
              className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg transition-colors ${showParticipants
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
                }`}
              title="Participants"
            >
              <Users size={isMobile ? 18 : 20} />
            </button>

            {/* Chat */}
            <button
              type="button"
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setUnreadCount(0);
              }}
              className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg transition-colors relative ${showChat
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-700 hover:bg-gray-600'
                }`}
              title="Chat"
            >
              <MessageSquare size={isMobile ? 18 : 20} />
              {unreadCount > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Raise Hand */}
            <button
              type="button"
              onClick={toggleHandRaise}
              className={`${isMobile ? 'p-3' : 'p-4'} rounded-lg transition-colors ${handRaised
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-gray-700 hover:bg-gray-600'
                }`}
              title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            >
              <Hand size={isMobile ? 18 : 20} className={handRaised ? 'animate-wiggle' : ''} />
            </button>

            {/* Leave/End */}
            {isHost ? (
              <button
                type="button"
                onClick={endSessionForAll}
                className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium flex items-center gap-2 ${isMobile ? 'ml-2' : 'ml-4'}`}
              >
                <PhoneOff size={isMobile ? 18 : 20} />
                {!isMobile && <span>End</span>}
              </button>
            ) : (
              <button
                type="button"
                onClick={leaveRoom}
                className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium flex items-center gap-2 ${isMobile ? 'ml-2' : 'ml-4'}`}
              >
                <PhoneOff size={isMobile ? 18 : 20} />
                {!isMobile && <span>Leave</span>}
              </button>
            )}
          </div>

          {/* Right side - Time display - Fixed width to prevent movement */}
          <div className="hidden md:block w-48 text-right text-sm text-gray-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

    </div>
  );
}
