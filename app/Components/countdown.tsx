"use client";

import React, { useState, useEffect } from "react";

type CountdownProps = {
    targetDate: string;
};

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();

        return Math.max(0, difference);
    };

    const [time, setTime] = useState<number>(0);

    useEffect(() => {
        const updateTime = () => {
            setTime(calculateTimeLeft());
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const getFormattedTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);

        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return {
            days,
            hours,
            minutes,
            seconds,
        };
    };

    const { days, hours, minutes, seconds } = getFormattedTime(time);

    return (
        <div className="w-full justify-center items-center flex">

            <div className="flex gap-6">
                <div className="flex-col justify-center items-center text-center">
                    <div className="font-bodoni text-2xl">
                        {days}
                    </div>
                    <div className="font-antic text-sm">
                        DAYS
                    </div>
                </div>
                <span className="w-0.5 h-12 bg-white"></span>
                <div className="flex-col justify-center items-center text-center">
                    <div className="font-bodoni text-2xl">
                        {hours}
                    </div>
                    <div className="font-antic text-sm">
                        HOURS
                    </div>
                </div>
                <span className="w-0.5 h-12 bg-white"></span>
                <div className="flex-col justify-center items-center text-center">
                    <div className="font-bodoni text-2xl">
                        {minutes}
                    </div>
                    <div className="font-antic text-sm">
                        MINUTES
                    </div>
                </div>
                <span className="w-0.5 h-12 bg-white"></span>
                <div className="flex-col justify-center items-center text-center">
                    <div className="font-bodoni text-2xl">
                        {seconds}
                    </div>
                    <div className="font-antic text-sm">
                        SECONDS
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Countdown;