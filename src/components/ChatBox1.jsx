import React, { useRef, useEffect, useState, useContext } from "react";
import moment from "moment";
import InputEmoji from "react-input-emoji";
import axios from "axios";
import { AIChatContext } from "../context/AIChatContext";
import { AI_CHATBOT_URL } from "../utils/constant";

const ChatBox = () => {
  const scroll = useRef();

  const { messages } = useContext(AIChatContext);
  const { mUser, setMUser } = useContext(AIChatContext);
  const [userChatID, setUserChatID] = useState(null);
  const { setUserAIChatID, textMessage, setTextMessage, sendTextMessage, setMessages } = useContext(AIChatContext);

  useEffect(() => {
    const registerUser = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("User"));

        if (storedUser && storedUser.user_name) {
          console.log(storedUser);

          const response = await axios.post("http://ec2-13-233-131-217.ap-south-1.compute.amazonaws.com:5000/api/users/register", {
            username: storedUser.user_name,
          });
          setMUser(response.data);

          console.log(response.data);
        } else {
          console.log("No user found in localStorage.");
        }
      } catch (error) {
        console.error("Error during user registration:", error);
      }
    };

    registerUser();
  }, []);

  useEffect(() => {
    const createChat = async () => {
      if (mUser) {
        try {
          const response2 = await axios.post("http://ec2-13-233-131-217.ap-south-1.compute.amazonaws.com:5000/api/chats/", {
            firstId: "66c5e5a825f42519a77afa5f",
            secondId: mUser._id,
          });
          console.log(response2.data);
          setUserChatID(response2.data._id);
          setUserAIChatID(response2.data._id);
        } catch (error) {
          console.error("Error during chat creation:", error);
        }
      }
    };

    createChat();
  }, [mUser]);

  useEffect(() => {
    const getChats = async () => {
      if (userChatID) {
        console.log("userChatID is available:", userChatID);

        try {
          const response = await axios.get(`http://ec2-13-233-131-217.ap-south-1.compute.amazonaws.com:5000/api/messages/${userChatID}`);
          console.log("Chat messages response:", response.data);

          if (response.data.length === 0) {
            console.log("No messages found, fetching AI message...");

            const aiResponse = await axios.post(AI_CHATBOT_URL, {
              user_id: mUser._id
            });
            console.log("AI response received:", aiResponse.data);

            const messageFromAI = aiResponse.data.response;

            const sendResponse = await axios.post(`http://ec2-13-233-131-217.ap-south-1.compute.amazonaws.com:5000/api/messages`, {
              chatId: userChatID,
              senderId: "66c5e5a825f42519a77afa5f",
              text: messageFromAI,
            });
            console.log("AI message sent successfully:", sendResponse.data);
          } else {
            console.log("Messages found, no AI response needed.");
          }
        } catch (e) {
          console.error("Error getting chat messages:", e);
        }
      } else {
        console.log("userChatID is not available.");
      }
    };

    getChats();
  }, [userChatID]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (userChatID) {
        try {
          const response = await axios.get(`http://ec2-13-233-131-217.ap-south-1.compute.amazonaws.com:5000/api/messages/${userChatID}`);
          setMessages(response.data);
        } catch (e) {
          console.error("Error getting chat messages:", e);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userChatID, setMessages]);

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col justify-between bg-black rounded-[16px] h-full overflow-hidden">
      <div className="flex justify-start items-center p-5 gap-4  bg-black  over text-white ">
        <img src="https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg"  className="h-10 w-10 rounded-full"/>
        <strong className="text-xl font-bold">AI Chatbot</strong>
      </div>
      <div className="flex flex-col gap-3 px-8 overflow-y-auto flex-grow">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.senderId === "66c5e5a825f42519a77afa5f"
                ? "self-start bg-neutral-700 text-left text-white"
                : "self-end bg-[#ff0059] text-white  text-right"
            } p-3 rounded-md max-w-[50%]`}
            ref={scroll}
          >
            <span>{message.text}</span>
            <span className="text-sm font-light block">
              {moment(message.createdAt).calendar()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6 p-7 mt-3  bg-black">
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          className="w-full p-2 rounded-md text-white bg-neutral-800 outline-none border-1 hover:outline-[#ff0059]"
          placeholder="Enter your message here"
        />
        <button
          className="bg-[#ff0059] hover:bg-red-500 text-white py-2 px-4 rounded-md"
          onClick={() => sendTextMessage(textMessage)}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;