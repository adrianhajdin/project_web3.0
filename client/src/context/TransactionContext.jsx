import { useState, createContext, useEffect } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";
export const TransactionContext = createContext();
const { ethereum } = window;
const createEthereumContract = (withSinger) => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    // getSigner方法应该在请求了metamask获取了账户信息后调用才有效
    const transactionsContract = new ethers.Contract(contractAddress, contractABI,
        withSinger ? provider.getSigner() : provider);
    return transactionsContract;
};

export const TransactionsProvider = (props) => {
    const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [currentAccount, setCurrentAccount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(window.localStorage.getItem("transactionCount"));
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const getAllTransactions = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                const availableTransactions = await transactionsContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));

                console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum is not present");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const checkIfWalletIsConnect = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_accounts" });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const checkIfTransactionsExists = async () => {
        try {
            if (ethereum) {
                console.log('start checkIfTransactionsExists')
                const transactionsContract = createEthereumContract(false);
                const currentTransactionCount = await transactionsContract.getTransactionCount();
                console.log(`getCurrentTransactionCount: ${currentTransactionCount}`);
                window.localStorage.setItem("transactionCount", currentTransactionCount);
                console.log('end checkIfTransactionsExists')
            }
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object");
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_requestAccounts", });

            setCurrentAccount(accounts[0]);
            // todo: 是否可以不用reload
            // window.location.reload();
        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object");
        }
    };

    const sendTransaction = async () => {
        try {
            if (ethereum) {
                const { addressTo, amount, keyword, message } = formData;
                const transactionsContract = createEthereumContract(true);
                const parsedAmount = ethers.utils.parseEther(amount);
                if (!currentAccount) {
                    connectWallet();
                }
                await ethereum.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: currentAccount,
                        to: addressTo,
                        gas: "0x5208", // 21000
                        value: parsedAmount._hex,
                    }],
                });
                const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

                setIsLoading(true);
                console.log(`Loading - ${transactionHash.hash}`);
                await transactionHash.wait();
                console.log(`Success - ${transactionHash.hash}`);
                setIsLoading(false);

                const transactionsCount = await transactionsContract.getTransactionCount();
                // 修改transactionsCount，同时也会触发useEffect再次执行checkIfTransactionsExists, 将最新的transactionsCount保存到localStorage中
                setTransactionCount(transactionsCount.toNumber());
                // todo: 是否可以不用reload
                // window.location.reload();
            } else {
                console.log("No ethereum object");
            }
        } catch (error) {
            console.error(error);

            throw new Error("No ethereum object");
        }
    };

    useEffect(() => {
        checkIfWalletIsConnect();
        checkIfTransactionsExists();
    }, [transactionCount]);

    return (
        <TransactionContext.Provider
            value={{
                transactionCount,
                connectWallet,
                transactions,
                currentAccount,
                isLoading,
                sendTransaction,
                handleChange,
                formData,
            }}
        >
            {props.children}
        </TransactionContext.Provider>
    );
};
