import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiUsers } from "react-icons/fi";
import { getAllUsers } from "../../../api/auth";
import CreateUser from "./CreateUser";
import UpdateUser from "./UpdateUser";
import DeleteUser from "./DeleteUser";
import SearchUser from "./SearchUser";
import CardUser from "./CardUser";
import Pagination from "../../common/Pagination";

const UserManager = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // Filter users when search term or filters change
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone &&
          user.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesGender =
        selectedGender === "all" || user.gender === selectedGender;
      return matchesSearch && matchesRole && matchesGender;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedGender]);

  const fetchUsers = async (pageNum = 1) => {
    try {
      setIsLoading(true);

      const response = await getAllUsers(pageNum);
      const usersData = response?.data?.data || response?.data || [];
      const metaData = response?.data || null;
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setMeta(metaData);
      setPage(metaData?.current_page || pageNum);
      setTotalUsers(metaData?.total || 0);
      setError("");
    } catch (err) {
      setError(
        t("adminDashboard.userManager.failedToFetch") + ": " + err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user creation
  const handleUserCreated = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    setIsCreateModalOpen(false);
  };

  // Handle user update
  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setIsEditModalOpen(false);
    setCurrentUser(null);
  };

  // Handle user deletion
  const handleUserDeleted = (userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Open edit modal
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">
          {t("adminDashboard.userManager.loadingUsers")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("adminDashboard.userManager.title")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {t("adminDashboard.users").toLowerCase()} {totalUsers}
            </div>
            {/* <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <FiPlus className="w-4 h-4" />
              {t("adminDashboard.userManager.addUser")}
            </button> */}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <SearchUser
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {t("adminDashboard.userManager.noUsersFound")}
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedRole !== "all" || selectedGender !== "all"
              ? t("adminDashboard.searchUser.noResults")
              : t("adminDashboard.userManager.addUser")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <CardUser
                key={user.id}
                user={user}
                onEdit={() => handleEditUser(user)}
                onDelete={() => handleDeleteUser(user)}
              />
            ))}
          </div>
          {meta && meta.last_page > 1 && (
            <Pagination
              page={page}
              setPage={setPage}
              pageCount={meta.last_page}
              totalItems={meta.total}
              itemsPerPage={meta.per_page || 10}
            />
          )}
        </>
      )}

      {/* Create User Modal */}
      <CreateUser
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Edit User Modal */}
      <UpdateUser
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Delete User Modal */}
      <DeleteUser
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
};

export default UserManager;
