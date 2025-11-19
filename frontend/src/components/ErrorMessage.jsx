import amumuImage from '../assets/amumu_crying.png';

export default function ErrorMessage({ message }) {

    return (
        <div className="mx-auto mt-8 p-6 max-w-2xl bg-gray-700 rounded-lg shadow-xl">
            <div className="flex items-start gap-4">
                <img 
                    src={amumuImage} 
                    alt="error" 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg flex-shrink-0"
                />
                <div className="flex flex-col justify-center">
                    <h2 className="text-red-400 text-xl sm:text-2xl font-bold mb-2">
                        Error { message.status ? message.status : '' }
                    </h2>
                    <p className="text-white text-base sm:text-lg">{ message.message ? message.message : '' }</p>
                </div>
            </div>
        </div>
    );
}