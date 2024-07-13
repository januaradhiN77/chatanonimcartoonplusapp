import React, { useState, useEffect, useRef } from "react";
import { addDoc, collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import axios from "axios";
import Swal from "sweetalert2";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userIp, setUserIp] = useState("");
  const [messageCount, setMessageCount] = useState(0);

  const chatsCollectionRef = collection(db, "chats");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const queryChats = query(chatsCollectionRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(queryChats, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // optionally include the document ID
        userIp: doc.data().userIp,
      }));
      setMessages(newMessages);
      if (shouldScrollToBottom) {
        scrollToBottom();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [shouldScrollToBottom]);

  useEffect(() => {
    getUserIp();
    checkMessageCount();
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
  };

  const getUserIp = async () => {
    try {
      const cachedIp = localStorage.getItem("userIp");
      if (cachedIp) {
        setUserIp(cachedIp);
        return;
      }
      const response = await axios.get("https://ipapi.co/json");
      const newUserIp = response.data.network;
      setUserIp(newUserIp);
      const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour
      localStorage.setItem("userIp", newUserIp);
      localStorage.setItem("ipExpiration", expirationTime.toString());
    } catch (error) {
      console.error("Failed to get IP address:", error);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "blacklist_ips"));
      const blockedIPs = querySnapshot.docs.map((doc) => doc.data().ipAddress);
      return blockedIPs;
    } catch (error) {
      console.error("Failed to fetch blocked IPs:", error);
      return [];
    }
  };

  const checkMessageCount = () => {
    const userIpAddress = userIp;
    const currentDate = new Date().toDateString();
    const storedDateString = localStorage.getItem("messageCountDate");

    if (currentDate === storedDateString) {
      const userSentMessageCount = parseInt(localStorage.getItem(userIpAddress)) || 0;
      if (userSentMessageCount >= 1000) {
        Swal.fire({
          icon: "error",
          title: "Message limit exceeded",
          text: "You have reached the message limit for today. Try again later.",
          customClass: {
            container: "sweet-alert-container",
          },
        });
      } else {
        setMessageCount(userSentMessageCount);
      }
    } else {
      localStorage.removeItem(userIpAddress);
      localStorage.setItem("messageCountDate", currentDate);
    }
  };

  const isIpBlocked = async () => {
    const blockedIPs = await fetchBlockedIPs();
    return blockedIPs.includes(userIp);
  };

  const sendMessage = async () => {
    if (message.trim() !== "") {
      const isBlocked = await isIpBlocked();

      if (isBlocked) {
        Swal.fire({
          icon: "error",
          title: "Blocked",
          text: "Your IP is blocked and cannot send messages.",
          customClass: {
            container: "sweet-alert-container",
          },
        });
        return;
      }

      const senderImageURL = auth.currentUser?.photoURL || "/AnonimUser.png";
      const trimmedMessage = message.trim().substring(0, 50);
      const userIpAddress = userIp;

      if (messageCount >= 1000) {
        Swal.fire({
          icon: "error",
          title: "Message limit exceeded",
          text: "You have exceeded the daily message limit. Try again tomorrow.",
          customClass: {
            container: "sweet-alert-container",
          },
        });
        return;
      }

      const updatedSentMessageCount = messageCount + 1;
      localStorage.setItem(userIpAddress, updatedSentMessageCount.toString());
      setMessageCount(updatedSentMessageCount);

      await addDoc(chatsCollectionRef, {
        message: trimmedMessage,
        sender: {
          image: senderImageURL,
        },
        timestamp: new Date(),
        userIp: userIp,
      });

      setMessage("");
      setTimeout(() => {
        setShouldScrollToBottom(true);
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore timestamp to JavaScript Date object
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const formattedTime = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <div className="flex flex-col justify-center">
      <div className="text-center text-4xl font-semibold text-white mb-50 ml-5">
        Chat Publik
      </div>
      <div className="mt-5 flex-grow overflow-y-auto" id="KotakPesan">
        {messages.map((msg, index) => (
          <div key={index} className="flex items-start text-sm py-1">
            <img src={msg.sender.image} alt="User Profile" className="h-8 w-8 mr-2 mt-8" />
            <div className="relative top-[0.30rem] text-white bg-black-message">
              <p className="text-base">{msg.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatTimestamp(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div id="InputChat" className="flex items-center text-white px-4 mt-3">
        <input
          className="bg-transparent flex-grow w-10 placeholder:text-white placeholder-opacity-60"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan kamu..."
          maxLength={60}
        />
        <button onClick={sendMessage} className="ml-2">
          <img src="/paper-plane.png" alt="Send" className="h-4 w-4 lg:h-6 lg:w-6" />
        </button>
      </div>
    </div>
  );
}

export default Chat;
