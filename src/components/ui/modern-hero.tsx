import { Star } from "lucide-react";
import React from "react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Hero7Props {
  heading?: string;
  description?: string;
  button?: {
    text: string;
    url?: string;
    onClick?: () => void;
  };
  reviews?: {
    count: number;
    sports: {
      emoji: string;
      alt: string;
    }[];
  };
}

const Hero7 = ({
  heading = "Transform Your Athletic Performance with AI-Powered Form Analysis",
  description = "Upload your shot, swing, or lift — get instant AI form feedback. Get personalized coaching to improve your form across all your favorite sports.",
  button = {
    text: "Get Started",
    url: "/select-sport",
  },
  reviews = {
    count: 5000,
    sports: [
      {
        emoji: "🏀",
        alt: "Basketball",
      },
      {
        emoji: "⛳",
        alt: "Golf",
      },
      {
        emoji: "🏋️",
        alt: "Weightlifting",
      },
      {
        emoji: "⚾",
        alt: "Baseball",
      },
      {
        emoji: "🎯",
        alt: "Sports",
      },
    ],
  },
}: Hero7Props) => {
  const handleButtonClick = () => {
    if (button.onClick) {
      button.onClick();
    } else if (button.url) {
      window.location.href = button.url;
    }
  };

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto flex max-w-screen-lg flex-col gap-6">
          <h1 className="text-3xl font-extrabold text-white lg:text-6xl">{heading}</h1>
          <p className="text-balance text-gray-300 lg:text-lg">
            {description}
          </p>
        </div>
        <Button 
          size="lg" 
          className="mt-10 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleButtonClick}
        >
          {button.text}
        </Button>
        <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-4 sm:flex-row">
          <span className="mx-4 inline-flex items-center -space-x-4">
            {reviews.sports.map((sport, index) => (
              <Avatar key={index} className="size-14 border-2 border-gray-700 bg-gray-800">
                <AvatarFallback className="bg-gray-800 text-2xl">
                  {sport.emoji}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
          <div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="size-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-left font-medium text-gray-400">
              from {reviews.count.toLocaleString()}+ users
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero7 };

