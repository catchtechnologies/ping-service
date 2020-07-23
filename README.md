# Ping-Service
Pings a host or IP address and passes data back and forth with Service Node.

## Usage  
``git clone https://github.com/catchtechnologies/ping-service.git``
```cd ping-service```  
```npm install```  
```node main.js --hosts google.com,192.168.1.1 --timeout 5 --serviceName OptionalName```

## Start Parameters  
- ```hosts``` A comma separated list of hosts.  
- ```timeout``` The amount of time in seconds to wait for a response.  

## Commands  
### Ping Hosts  
- ```pingHosts``` Pings the hosts provided in the `hosts` parameter at startup.  
  
 ### Ping Direct  
```ping:google.com,192.168.1.1``` Pings a list of provided hosts separated by commas.  

## Responses    
- ```isAlive:google.com``` Indicates a reply was received from the host.  
  
- ```isNotAlive:192.168.1.1``` Indicates no reply was received from the host within the given timeout.    
