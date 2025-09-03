import React from 'react';

const LoadingComponent = ({
    type = 'spinner',
    message = 'Loading...',
    size = 'medium',
    color = 'blue',
    showBackground = false
}) => {
    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-12 w-12',
        large: 'h-16 w-16'
    };

    const colorClasses = {
        blue: 'border-blue-500 dark:border-blue-400',
        purple: 'border-purple-500 dark:border-purple-400',
        green: 'border-green-500 dark:border-green-400',
        pink: 'border-pink-500 dark:border-pink-400',
        indigo: 'border-indigo-500 dark:border-indigo-400'
    };

    const bgColorClasses = {
        blue: 'bg-blue-500 dark:bg-blue-400',
        purple: 'bg-purple-500 dark:bg-purple-400',
        green: 'bg-green-500 dark:bg-green-400',
        pink: 'bg-pink-500 dark:bg-pink-400',
        indigo: 'bg-indigo-500 dark:bg-indigo-400'
    };

    const bgColorClassesDark = {
        blue: 'bg-blue-600 dark:bg-blue-500',
        purple: 'bg-purple-600 dark:bg-purple-500',
        green: 'bg-green-600 dark:bg-green-500',
        pink: 'bg-pink-600 dark:bg-pink-500',
        indigo: 'bg-indigo-600 dark:bg-indigo-500'
    };

    const SpinnerLoader = () => (
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 ${colorClasses[color]} border-t-transparent`}></div>
    );

    const DotsLoader = () => (
        <div className="flex space-x-2">
            <div className={`w-3 h-3 ${bgColorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-3 h-3 ${bgColorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-3 h-3 ${bgColorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
    );

    const PulseLoader = () => (
        <div className={`relative ${sizeClasses[size]}`}>
            <div className={`absolute inset-0 ${bgColorClasses[color]} rounded-full animate-ping opacity-75`}></div>
            <div className={`relative ${sizeClasses[size]} ${bgColorClassesDark[color]} rounded-full`}></div>
        </div>
    );

    const BarsLoader = () => (
        <div className="flex space-x-1 items-end">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`w-2 ${bgColorClasses[color]} rounded-sm animate-pulse`}
                    style={{
                        height: `${20 + (i % 3) * 10}px`,
                        animationDelay: `${i * 100}ms`,
                        animationDuration: '1s'
                    }}
                ></div>
            ))}
        </div>
    );

    const WaveLoader = () => (
        <div className="flex space-x-1 items-center">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className={`w-4 h-4 ${bgColorClasses[color]} rounded-full animate-bounce`}
                    style={{
                        animationDelay: `${i * 200}ms`,
                        animationDuration: '1.4s'
                    }}
                ></div>
            ))}
        </div>
    );

    const renderLoader = () => {
        switch (type) {
            case 'dots':
                return <DotsLoader />;
            case 'pulse':
                return <PulseLoader />;
            case 'bars':
                return <BarsLoader />;
            case 'wave':
                return <WaveLoader />;
            default:
                return <SpinnerLoader />;
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen transition-all duration-300 ${showBackground
            ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300'
            : 'bg-transparent'
            }`}>
            <div className={`text-center p-8 rounded-2xl max-w-sm mx-4 transition-all duration-300  bg-transparent`}>
                <div className="mb-6 flex justify-center">
                    {renderLoader()}
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait a moment...
                </p>
            </div>
        </div>
    );
};

// Demo component to showcase different loading styles
const LoadingDemo = ({ showBackground, message }) => {
    const [currentLoader, setCurrentLoader] = React.useState('spinner');
    const [currentColor, setCurrentColor] = React.useState('blue');

    const loaderTypes = ['spinner', 'dots', 'pulse', 'bars', 'wave'];
    const colors = ['blue', 'purple', 'green', 'pink', 'indigo'];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLoader(prev => {
                const currentIndex = loaderTypes.indexOf(prev);
                return loaderTypes[(currentIndex + 1) % loaderTypes.length];
            });
            setCurrentColor(prev => {
                const currentIndex = colors.indexOf(prev);
                return colors[(currentIndex + 1) % colors.length];
            });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            <LoadingComponent
                type={currentLoader}
                color={currentColor}
                showBackground={showBackground}
                message={message}
                size="large"
            />
        </div>
    );
};

export default LoadingDemo;