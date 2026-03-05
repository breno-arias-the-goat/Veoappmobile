// Dummy file for web to bypass missing react-native-video-processing native binaries
export const ProcessingManager = {
    trim: async () => {
        console.warn('Video processing is disabled on the web.');
        return null;
    }
};
