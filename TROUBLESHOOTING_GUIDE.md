# Troubleshooting Guide for Live Class

## Common Issues and Solutions

### 1. Mute All Button Not Visible

**Problem**: Host cannot see the "Mute All" button in the participants panel.

**Debugging Steps**:
1. Check the debug info panel in the participants sidebar
2. Verify "Is Host" shows "Yes"
3. Check URL parameters - ensure `creator=1` is present
4. Look at browser console for any errors

**Solutions**:
- Ensure you join with `creator=1` in the URL: `/dashboard/class?roomId=test&creator=1&name=Host`
- Refresh the page and rejoin the room
- Check browser console for token decoding errors

### 2. Microphone Selection Not Working

**Problem**: Cannot switch between different microphones.

**Debugging Steps**:
1. Open browser console and look for device enumeration logs
2. Check if microphone permissions are granted
3. Verify multiple audio devices are detected
4. Test the refresh button in the microphone dropdown

**Solutions**:
- Grant microphone permissions when prompted
- Use the refresh button (↻) in the microphone dropdown
- Try disconnecting and reconnecting audio devices
- Restart the browser if permissions are stuck

### 3. Device Labels Not Showing

**Problem**: Microphone dropdown shows "Microphone 1", "Microphone 2" instead of actual device names.

**Cause**: Browser security requires explicit permission to access device labels.

**Solutions**:
- The app now requests permissions automatically on load
- If still not working, manually grant microphone permissions in browser settings
- Refresh the page after granting permissions

### 4. Screen Sharing Not Working on Mobile

**Problem**: Screen sharing fails on mobile devices.

**Expected Behavior**: 
- Mobile Chrome: Limited support with optimized settings
- Mobile Safari: May require user gesture
- Some mobile browsers don't support screen sharing

**Solutions**:
- Use desktop browser for screen sharing when possible
- On mobile, ensure you tap the screen share button (don't long press)
- Try refreshing if the first attempt fails

## Testing Your Setup

### Host Testing Checklist
1. **Join as Host**: Use URL with `creator=1`
2. **Check Debug Panel**: Should show "Is Host: Yes"
3. **Test Mute All**: Button should be visible in participants panel
4. **Test Individual Mute**: Buttons appear next to each participant
5. **Test Microphone Selection**: Multiple devices should be listed

### Participant Testing Checklist
1. **Join as Guest**: Use URL without `creator=1` or `creator=0`
2. **Check Debug Panel**: Should show "Is Host: No"
3. **Test Admin Commands**: Should respond to host mute commands
4. **Test Device Selection**: Should be able to switch microphones

## URL Parameters

### Required Parameters
- `roomId`: Unique identifier for the room
- `userId`: User identifier (can be any string)
- `name`: Display name for the user

### Optional Parameters
- `creator`: Set to `1` for host, `0` or omit for guest

### Example URLs
```
Host: /dashboard/class?roomId=test123&userId=host1&creator=1&name=Teacher
Guest: /dashboard/class?roomId=test123&userId=student1&creator=0&name=Student
```

## Browser Console Commands

### Check Device Permissions
```javascript
navigator.permissions.query({name: 'microphone'}).then(result => console.log('Mic permission:', result.state));
navigator.permissions.query({name: 'camera'}).then(result => console.log('Camera permission:', result.state));
```

### List Available Devices
```javascript
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('Audio inputs:', devices.filter(d => d.kind === 'audioinput'));
  console.log('Video inputs:', devices.filter(d => d.kind === 'videoinput'));
});
```

### Test Microphone Access
```javascript
navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
  console.log('Microphone access granted');
  stream.getTracks().forEach(track => track.stop());
}).catch(err => console.error('Microphone access denied:', err));
```

## Common Error Messages

### "Could not switch microphone"
- **Cause**: Device not available or permission denied
- **Solution**: Check device connections and browser permissions

### "Cannot switch microphone - not connected to room"
- **Cause**: LiveKit room not properly initialized
- **Solution**: Wait for room connection, refresh page if needed

### "Screen sharing is not supported on this device"
- **Cause**: Browser or device doesn't support screen capture
- **Solution**: Use desktop browser or different device

## Performance Tips

### For Better Audio Quality
1. Use wired headphones to prevent echo
2. Choose high-quality microphone in device selection
3. Ensure stable internet connection
4. Close unnecessary browser tabs

### For Better Video Performance
1. Use good lighting for camera
2. Close other video applications
3. Use lower resolution on slower connections
4. Limit number of participants with video enabled

## Support Information

If issues persist:
1. Check browser console for detailed error messages
2. Test with different browsers (Chrome recommended)
3. Verify network connectivity and firewall settings
4. Ensure WebRTC is enabled in browser settings