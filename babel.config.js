module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'nativewind/babel',
            [
                'module-resolver',
                {
                    alias: {
                        'react-native-video-processing': './mocks/react-native-video-processing.web.js'
                    }
                }
            ]
        ]
    };
};
