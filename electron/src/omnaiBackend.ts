import {spawn, ChildProcess } from "child_process"; 
import {join} from "path"; 
import { existsSync } from "fs";
import {app} from "electron"; 
import * as net from 'net';

export const omnaiscopeBackendManager = (()=> { // singelton for only one possible encapsulated instance of the backend 
    let backendProcess : ChildProcess | null = null;
    let port : number = 0;  
    let os = "";


    const miniOmniPath = (osString: string): string => {
        if (osString === "linux") {
            return "MiniOmni";
        } else if (osString === "win32") {
            return "MiniOmni.exe";
        }
    }

    function isAddressInfo(address: string | net.AddressInfo | null): address is net.AddressInfo {
        return typeof address === 'object' && address !== null && typeof address.port === 'number';
    }

    function osFilePath(osString: string): string {
        if (osString === "linux") {
            return "MiniOmni";
        } else if (osString === "win32") {
            return "MiniOmni.exe";
        }
    }

    async function getFreePort() : Promise<number>{
        return new Promise((resolve, reject) => {
            const server = net.createServer(); 
            server.unref(); //allows the programm to exit if this is the only server running 
            server.once("error", err => reject(err)); //first handle errors then listen to skip an internal error
            server.listen(0, () => { // the OS gets an available port
                const address = server.address();
                if (!isAddressInfo(address)) { // check that server.adress is from type AddressInfo
                    return reject(new Error('Error: Port either does not exist or address is not an AddressInfo.'));
                }

                const port = (address as net.AddressInfo).port;
                server.close(() => resolve(port));
            });
        });
    }

    function getBackendPath(): string {
        const exePath: string = app.isPackaged 
        ? join(process.resourcesPath, miniOmniPath(os)) // production mode 
        : join(__dirname, "..", "res", "omnai_BE", miniOmniPath(os)) // dev mode 

        return exePath; 
    }

    async function startBackend(osIn: string): Promise<void> {
        const exePath : string = getBackendPath(); 
        os = osIn;

        port = await getFreePort(); 

        if(existsSync(exePath)){
            backendProcess = spawn(exePath, ["-w", "-p", port.toString()]); 
            console.log(`Backend process started on port ${port}`);
        }   
    }

    function stopBackend(): void {
        if(backendProcess) {
            backendProcess.kill(); 
            console.log("Backend process stopped");
        }
    }

    function getPort(): number {
        return port; 
    }

    return {
        startBackend, 
        stopBackend, 
        getPort
    }; 
})(); 