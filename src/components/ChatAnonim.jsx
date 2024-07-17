import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { addDoc, collection, query, orderBy, onSnapshot, getDocs, doc, setDoc } from "firebase/firestore";
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const chatsCollectionRef = collection(db, "chats");
  const usernamesCollectionRef = collection(db, "usernames");
  const messagesEndRef = useRef(null);

  const adminNames = ["Januarzzz", "bukan kafka", "Admin3"];

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
    const storedImage = localStorage.getItem("userImage");
    if (storedName) {
      setName(storedName);
      setIsNameEntered(true);
    }
    if (storedImage) {
      setSelectedImage(storedImage);
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
      const newUserIp = response.data.network.ip;
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

  const checkIfNameTaken = async (name) => {
    const querySnapshot = await getDocs(usernamesCollectionRef);
    const existingUsers = querySnapshot.docs.map((doc) => doc.data());
    return existingUsers.some(user => user.name === name && user.ip !== userIp);
  };

  const registerName = async (name) => {
    await setDoc(doc(usernamesCollectionRef, name), {
      name: name,
      ip: userIp
    });
  };

  const sendMessage = async () => {
    if (message.trim() !== "" && name.trim() !== "" && !isSendingMessage) {
      setIsSendingMessage(true);

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
        setIsSendingMessage(false);
        return;
      }

      const senderImageURL = selectedImage || auth.currentUser?.photoURL || "/AnonimUser.png";
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
        setIsSendingMessage(false);
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
        setIsSendingMessage(false);
      }, 2000);
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

  const handleNameSubmit = async () => {
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
      const nameTaken = await checkIfNameTaken(name);
      if (nameTaken) {
        Swal.fire({
          icon: "error",
          title: "Nama sudah dipakai",
          text: "Nama ini sudah dipakai oleh pengguna lain, silakan pilih nama lain.",
          customClass: {
            container: "sweet-alert-container",
          },
        });
      } else {
        await registerName(name);
        localStorage.setItem("userName", name);
        if (selectedImage) {
          localStorage.setItem("userImage", selectedImage);
        }
        setIsNameEntered(true);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");
    setIsNameEntered(false);
    setName("");
    setSelectedImage(null);
    setIsProfileModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Pastikan file yang diunggah adalah gambar dengan format yang diizinkan
      if (file.type.startsWith('image/') && ['image/gif', 'image/png', 'image/jpeg'].includes(file.type)) {
        // Validasi ukuran file
        if (file.size <= 700 * 1024) { // 700 KB dalam byte
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result);
          };
          reader.readAsDataURL(file);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Ukuran File Terlalu Besar',
            text: 'Ukuran file gambar GIF melebihi batas maksimal 700 KB.',
            customClass: {
              container: 'sweet-alert-container',
            },
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Format Tidak Didukung',
          text: 'Harap unggah file GIF, PNG, JPG, atau JPEG untuk gambar profil.',
          customClass: {
            container: 'sweet-alert-container',
          },
        });
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);
    const formattedTime = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const toggleProfileModal = () => {
    setIsProfileModalOpen(!isProfileModalOpen);
  };

  return (
    <div className="flex flex-col justify-center">
      {!isNameEntered ? (
        <div id="InputName" className="flex flex-col justify-center items-center mt-5">
          <input
            className="bg-transparent text-white placeholder-opacity-60 placeholder-white mb-2 justify-center"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama kamu..."
          />
          <p className="text-white font-bold mt-5">Pilih gambar untuk profil (opsional)</p>
          <input type="file" onChange={handleImageChange} accept="image/gif, image/png, image/jpeg" className="mb-2 text-white mt-2" />
          <button
            id="sendSumbit" className="bg-black text-white px-4 py-2 mt-2 rounded"
            onClick={handleNameSubmit}
          >
            Lanjut
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-white mt-12">Halo, {name}!</p>
            <button className="text-white font-bold mt-12 cursor-pointer" onClick={toggleProfileModal}>
              <img src={selectedImage || "/AnonimUser.png"} alt="Profile" className="h-8 w-8 rounded-full" />
            </button>
          </div>

          <div className="mt-1 flex-grow overflow-y-auto" id="KotakPesan">
            {messages.map((msg, index) => (
              <div className={`flex ${msg.sender.name === name ? "justify-end" : "justify-start"} items-start py-1 ${msg.sender.name === name ? "bg-black-message-sender" : "bg-black-message"} rounded-md p-2 mb-2 max-w-[75%]`} key={index}>
                {msg.sender.name !== name && (
                  <img src={msg.sender.image} alt="User Profile" className="h-12 w-12 rounded-full mr-2 imgBorder" />
                )}
                <div className="flex flex-col right-text">
                  <div className="flex items-center">
                    <p id="textSizeName" className="text-white font-bold">{msg.sender.name}</p>
                    {adminNames.includes(msg.sender.name) && (
                      <img src="/adminIcon.png" alt="Admin Verification Icon" className="h-4 w-4 ml-1" />
                    )}
                  </div>
                  <p id="textSizeMessage" className="text-gray-400">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatTimestamp(msg.timestamp)}</p>
                </div>
                {msg.sender.name === name && (
                  <img src={msg.sender.image} alt="User Profile" className="h-12 w-12 rounded-full ml-2 left imgBorder" />
                )}
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
                placeholder="Ketik pesan"
              />
            </div>
            <button onClick={sendMessage} id="send" className="ml-2 bg-black p-2 rounded">
              <img src="/paper-plane.png" alt="Send" className="h-5 w-5 lg:h-6 lg:w-6 filter invert" />
            </button>
          </div>

          <Modal
            isOpen={isProfileModalOpen}
            onRequestClose={toggleProfileModal}
            contentLabel="Profile Modal"
            className="profile-modal"
            overlayClassName="profile-modal-overlay"
          >
            <div className="profile-modal-content">
              <img src={selectedImage || "/AnonimUser.png"} alt="Profile" className="h-24 w-24 rounded-full mx-auto" />
              <p className="text-center text-white mt-4">{name}</p>
              {adminNames.includes(name) && (
                <p className="text-center text-green-500 font-bold">Verified Admin</p>
              )}
              <p className="text-center text-white">Total messages: {messageCount}</p>
              <button className="logout mt-5 text-white rounded block" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Chat;
