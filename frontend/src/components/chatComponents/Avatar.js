const Avatar = ({ src, alt, className = "" }) => (
    <div className={`overflow-hidden rounded-full ${className}`}>
        {src ? (
            <img 
                src={src} 
                alt={alt} 
                className="h-full w-full object-cover"
            />
        ) : (
            <div className="h-full w-full bg-gray-300 flex items-center justify-center text-gray-600">
                {alt?.charAt(0).toUpperCase() || "U"}
            </div>
        )}
    </div>
);

export default Avatar;