import React, { useState, useEffect, useRef } from "react";
import { addDoc, collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import axios from "axios";
import Swal from "sweetalert2";

const Chat = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [userIp, setUserIp] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false); // State untuk menandai sedang mengirim pesan

  const chatsCollectionRef = collection(db, "chats");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const queryChats = query(chatsCollectionRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(queryChats, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
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
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setName(storedName);
      setIsNameEntered(true);
    }
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
      setMessageCount(userSentMessageCount);
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
    if (message.trim() !== "" && name.trim() !== "" && !isSendingMessage) {
      setIsSendingMessage(true); // Menandai sedang mengirim pesan

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
        setIsSendingMessage(false); // Mengatur kembali ke false setelah selesai
        return;
      }

      const senderImageURL = auth.currentUser?.photoURL || "/AnonimUser.png";
      const trimmedMessage = message.trim();
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
        setIsSendingMessage(false); // Mengatur kembali ke false setelah selesai
        return;
      }

      const updatedSentMessageCount = messageCount + 1;
      localStorage.setItem(userIpAddress, updatedSentMessageCount.toString());
      setMessageCount(updatedSentMessageCount);

      await addDoc(chatsCollectionRef, {
        message: trimmedMessage,
        sender: {
          name: name,
          image: senderImageURL,
        },
        timestamp: new Date(),
        userIp: userIp,
      });

      setMessage("");
      setTimeout(() => {
        setShouldScrollToBottom(true);
        setIsSendingMessage(false); // Mengatur kembali ke false setelah selesai
      }, 3000); // Menunggu 1 detik sebelum mengatur kembali ke false
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Isi pesannya dong :)",
        customClass: {
          container: "sweet-alert-container",
        },
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNameSubmit = () => {
    if (name.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Name diperlukan",
        text: "Tolong isi nama kamu untuk melanjutkan.",
        customClass: {
          container: "sweet-alert-container",
        },
      });
    } else {
      localStorage.setItem("userName", name);
      setIsNameEntered(true);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const formattedTime = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <div className="flex flex-col justify-center">
      {!isNameEntered ? (
        <div id="InputName" className="flex flex-col items-center mt-5">
          <input
            className="bg-transparent text-white placeholder-opacity-60 placeholder-white mb-2"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama kamu..."
          />
          <button
            id="sendSumbit" className="bg-black text-white px-4 py-2 mt-2 rounded"
            onClick={handleNameSubmit}
          >
            Lanjut
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex-grow overflow-y-auto" id="KotakPesan">
            {messages.map((msg, index) => (
              <div key={index} className="flex items-start text-sm py-1">
                <img src={msg.sender.image} alt="User Profile" className="h-8 w-8 mr-2 mt-8" />
                <div className="relative top-[0.20rem] text-white bg-black-message">
                  <p id="textSizeName" className="font-bold">{msg.sender.name}</p>
                  <p className="text-base text-gray-400">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatTimestamp(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="flex items-center text-white mt-3 w-100 ml-7">
            <div id="InputChat" className="flex-grow">
              <input
                className="bg-transparent w-full placeholder:text-white placeholder-opacity-60"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik pesan..."
              />
            </div>
            <button onClick={sendMessage} id="send" className="ml-2 bg-black p-2 rounded">
              <img src="/paper-plane.png" alt="Send" className="h-5 w-5 lg:h-6 lg:w-6 filter invert" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;
