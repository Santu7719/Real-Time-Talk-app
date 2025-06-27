import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  Flex,
  Stack,
  Text,
  Divider,
} from "@chakra-ui/react";
import { useContext } from "react";
import chatContext from "../../context/chatContext";
import { ChatIcon } from "@chakra-ui/icons"; // Replace BroadcastIcon with ChatIcon

const GroupChatModal = ({ children }) => {
  // Add new state variables
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const context = useContext(chatContext);
  const { hostName, user, socket, setMyChatList, myChatList } = context;

  const handleSearch = async (query) => {
    setSearch(query);
    try {
      setLoading(true);
      // Use myChatList directly instead of making another API call
      const friends = myChatList
        .filter(chat => !chat.isGroup) // Filter out group chats
        .map(chat => {
          const friend = chat.members.find(member => member?._id !== user?._id);
          return {
            _id: friend?._id,
            name: friend?.name,
            email: friend?.email,
            profilePic: friend?.profilePic || "https://via.placeholder.com/150"
          };
        })
        .filter(friend => friend._id); // Remove any undefined entries

      // Filter based on search query if provided
      const filteredFriends = query 
        ? friends.filter(friend => 
            friend.name.toLowerCase().includes(query.toLowerCase()) &&
            !selectedUsers.some(sel => sel._id === friend._id)
          )
        : friends.filter(friend => 
            !selectedUsers.some(sel => sel._id === friend._id)
          );

      setSearchResult(filteredFriends);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to process friends list",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

  // Load initial friends list when modal opens
  useEffect(() => {
    if (isOpen) {
      handleSearch("");
    }
  }, [isOpen]);

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || selectedUsers.length < 2) {
      toast({
        title: "Please fill all the fields",
        description: "Group name and at least 2 members are required",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const response = await fetch(`${hostName}/conversation/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name: groupChatName,
          members: [...selectedUsers.map((u) => u._id), user._id], // Include current user
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const data = await response.json();
      setMyChatList([data, ...myChatList]);
      onClose();
      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset form
      setGroupChatName("");
      setSelectedUsers([]);
      setSearchResult([]);
    } catch (error) {
      toast({
        title: "Failed to Create the Group!",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Please enter a message",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setIsBroadcasting(true);
      // Get all friends from chat list
      const friends = myChatList
        .filter(chat => !chat.isGroup)
        .map(chat => {
          const friend = chat.members.find(member => member?._id !== user?._id);
          return {
            _id: friend?._id,
            conversationId: chat._id
          };
        })
        .filter(friend => friend._id);

      // Emit broadcast message to socket for each friend
      friends.forEach(friend => {
        socket.emit("new-message", {
          conversationId: friend.conversationId,
          sender: user._id,
          text: broadcastMessage,
          receiver: friend._id
        });
      });

      toast({
        title: "Broadcast sent successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      setBroadcastMessage("");
      setIsBroadcasting(false);
      onClose();
    } catch (error) {
      toast({
        title: "Failed to broadcast message",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setIsBroadcasting(false);
    }
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center">
            {/* Add Broadcast Section */}
            <Box w="100%" mb={4} p={3} borderRadius="lg" borderWidth="1px">
              <Text fontSize="xl" mb={2}>
                Broadcast Message
              </Text>
              <FormControl>
                <Input
                  placeholder="Type your broadcast message"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  mb={2}
                />
              </FormControl>
              <Button
                colorScheme="purple"
                w="100%"
                onClick={handleBroadcast}
                isLoading={isBroadcasting}
                leftIcon={<ChatIcon />} // Use ChatIcon instead of BroadcastIcon
              >
                Broadcast to All Friends
              </Button>
            </Box>

            <Divider my={4} />
            
            {/* Existing Group Chat Creation Form */}
            <Text fontSize="xl" mb={2} w="100%">
              Or Create a Group
            </Text>
            <FormControl>
              <Input
                placeholder="Chat Name"
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>
            <Box w="100%" display="flex" flexWrap="wrap">
              {selectedUsers.map((u) => (
                <Box
                  key={u._id}
                  px={2}
                  py={1}
                  borderRadius="lg"
                  m={1}
                  mb={2}
                  variant="solid"
                  fontSize={12}
                  backgroundColor="purple.500"
                  color="white"
                  cursor="pointer"
                  onClick={() => handleDelete(u)}
                >
                  {u.name}
                  <span style={{ marginLeft: "5px" }}>×</span>
                </Box>
              ))}
            </Box>
            {loading ? (
              <div>Loading...</div>
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((user) => (
                  <Box
                    key={user._id}
                    onClick={() => handleGroup(user)}
                    cursor="pointer"
                    bg="#E8E8E8"
                    _hover={{
                      background: "#38B2AC",
                      color: "white",
                    }}
                    w="100%"
                    display="flex"
                    alignItems="center"
                    color="black"
                    px={3}
                    py={2}
                    mb={2}
                    borderRadius="lg"
                  >
                    <Box>
                      <Text>{user.name}</Text>
                      <Text fontSize="xs">
                        <b>Email : </b>
                        {user.email}
                      </Text>
                    </Box>
                  </Box>
                ))
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSubmit} colorScheme="blue">
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;