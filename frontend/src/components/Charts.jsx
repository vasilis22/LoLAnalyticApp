import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Charts({ timelineData, player }) {
    const getTheoreticalCS = (minute) => {
        return Math.floor(minute * 12.5);
    };

    const prepareCSData = () => {
        if (!timelineData) return [];

        return timelineData.frames.map((frame, index) => {
            const playerFrame = frame.participantFrames[player.participantId];
            return {
                minute: index,
                actualCS: playerFrame.minionsKilled + playerFrame.jungleMinionsKilled,
                theoreticalCS: getTheoreticalCS(index)
            };
        });
    };

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Creep Score Timeline</h3>
            
            <LineChart
                width={800}
                height={400}
                data={prepareCSData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
            >
                <XAxis
                    stroke="#fff"
                    label={{ value: 'Minutes', position: 'bottom', fill: '#fff' }}
                />
                <YAxis
                    stroke="#fff"
                    label={{ value: 'Creep Score', angle: -90, position: 'left', fill: '#fff' }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    labelStyle={{ color: '#fff' }}
                />
                <Legend 
                    verticalAlign={'top'}
                />
                <Line
                    type="monotone"
                    dataKey="actualCS"
                    stroke="#4ade80"
                    name="Your CS"
                    strokeWidth={2}
                />
                <Line
                    type="monotone"
                    dataKey="theoreticalCS"
                    stroke="#60a5fa"
                    name="Perfect CS"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                />
            </LineChart>

        </div>
    );
}