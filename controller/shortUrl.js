const generateShortUrl = require('../helper/helper').generateShortURL;
const rateLimiter = require('../helper/helper').rateLimit;
const Url = require('../model/url');
const geoip = require('geoip-lite');


exports.getShortURL = async (req,res,next) => {
    let lastRedirectTime = {};

    const alias = req.params.alias;
    const ipAddress = req.ip;
    
        try {
            const urlEntry = await Url.findOne({ shortURL: `http://localhost:3030/api/shorten/${alias}` });
    
            if (!urlEntry) {
                return res.status(404).json({ error: "Short URL not found" });
            }

            const currentTime = Date.now();
        const timeSinceLastRedirect = currentTime - (lastRedirectTime[ipAddress] || 0);

        // Check if the last redirect was within the last second (1000 ms)
        if (timeSinceLastRedirect > 1000) {
            urlEntry.redirects += 1; // Increment only if enough time has passed
            lastRedirectTime[ipAddress] = currentTime; // Update the last redirect time
        }
    
            // Track unique users
            
            if (!urlEntry.uniqueUsers.includes(ipAddress)) {
                urlEntry.uniqueUsers.push(ipAddress); // Add the IP address to the unique users array
                urlEntry.uniqueUsersCount += 1; // Increment unique users count
            }
    
            // Track clicks by date
            const today = new Date();
            const dateString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
            const clickData = urlEntry.clicksByDate.find(data => data.date.toISOString().split('T')[0] === dateString);
            
            if (clickData) {
                clickData.count += 1; // Increment today's click count
            } else {
                // If no entry for today, create a new one
                urlEntry.clicksByDate.push({ date: today, count: 1 });
            }
    
            // Track OS and Device Type
            const userAgent = req.headers['user-agent'];
            const os = userAgent.includes("Windows") ? "Windows" :
                       userAgent.includes("Mac") ? "macOS" :
                       userAgent.includes("Linux") ? "Linux" :
                       userAgent.includes("Android") ? "Android" :
                       userAgent.includes("iOS") ? "iOS" : "Unknown";
    
            const deviceType = userAgent.includes("Mobile") ? "Mobile" : "Desktop";
    
            // Update OS data
            const osData = urlEntry.osType.find(data => data.osName === os);
            if (osData) {
                osData.uniqueClicks += 1; // Increment unique clicks for this OS
                osData.uniqueUsers += 1; // Increment unique users for this OS
            } else {
                // If no entry for this OS, create a new one
                urlEntry.osType.push({ osName: os, uniqueClicks: 1, uniqueUsers: 1 });
            }
    
            // Update Device Type data
            const deviceData = urlEntry.deviceType.find(data => data.deviceName === deviceType);
            if (deviceData) {
                deviceData.uniqueClicks += 1; // Increment unique clicks for this device type
                deviceData.uniqueUsers += 1; // Increment unique users for this device type
            } else {
                // If no entry for this device type, create a new one
                urlEntry.deviceType.push({ deviceName: deviceType, uniqueClicks: 1, uniqueUsers: 1 });
            }
    
            // Save the updated URL entry
            await urlEntry.save();
    
            // Log analytics data
            const geo = geoip.lookup(ipAddress);
            console.log({
                timestamp: new Date(),
                userAgent,
                ipAddress,
                geo
            });
            
            // Redirect to the original long URL
            return res.redirect(urlEntry.longURL);
    
        } catch (error) {
            console.error("Error during redirect:", error);
            return res.status(500).json({ error: "An error occurred while processing the redirect." });
        }
};

exports.postShortUrl = async (req,res,next) => {

    const longURL = req.body.longURL;
    const customAlias = req.body.customAlias;
    const topic = req.body.topic;

    const urlStore = {};

    if(!longURL){
        res.status(400).json({error:"URL not found, please provide the URL"});
    }

    try{
        await rateLimiter.consume(req.ip);

        const appendAlias = customAlias || generateShortUrl();
        const shortURL = `http://localhost:3030/api/shorten/${appendAlias}`;
        
        const urlEntry = new Url({
            longURL,
            shortURL,
            appendAlias,
            topic,
            createdAt : new Date()
        });
        
        await urlEntry.save();
        
    
    res.status(200).json({
    shortUrl: shortURL,
    createdAt: urlEntry.createdAt,

    });
    }
    catch(error) {
        res.status(429).json({ error: "You can only submit 5 requests in 1 min. Please try again later after some time !!" });
        console.log(error.errorResponse.errmsg);
    }
}

exports.getURLAnalytics = async (req,res,next) => {
    const alias = req.params.alias;

    try {
        const urlEntry = await Url.findOne({ shortURL: `http://localhost:3030/api/shorten/${alias}` });

        if (!urlEntry) {
            return res.status(404).json({ error: "Short URL not found" });
        }

        // Prepare the analytics data
        const analyticsData = {
            totalClicks: urlEntry.redirects,
            uniqueUsers: urlEntry.uniqueUsers,
            clicksByDate: urlEntry.clicksByDate,
            osType: urlEntry.osType,
            deviceType: urlEntry.deviceType
        };

        return res.status(200).json(analyticsData);
    } catch (error) {
        console.error("Error retrieving analytics:", error);
        return res.status(500).json({ error: "An error occurred while retrieving analytics." });
    }
}


exports.getURLAnalytics_topic = async (req,res,next) => {

    const topic = req.params.topic;

    try {
        const urls = await Url.find({ topic });

        if (!urls.length) {
            return res.status(404).json({ error: "No URLs found for this topic" });
        }

        let totalClicks = 0;
        const uniqueUsers = new Set(); // Use a Set to track unique user IPs
        const clicksByDate = {};
        
        urls.forEach(url => {
            totalClicks += url.redirects; // Increment total clicks
            url.uniqueUsers.forEach(ip => uniqueUsers.add(ip)); // Add each unique user IP to the Set

            // Aggregate clicks by date
            url.clicksByDate.forEach(clickData => {
                const dateString = clickData.date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
                clicksByDate[dateString] = (clicksByDate[dateString] || 0) + clickData.count; // Increment click count for the date
            });
        });

        const analyticsData = {
            totalClicks,
            uniqueUsers: uniqueUsers.size, // The size of the Set gives the count of unique users
            clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
            urls: urls.map(url => ({
                shortUrl: url.shortURL,
                totalClicks: url.redirects,
                uniqueUsers: url.uniqueUsers.length // Count of unique users for this specific URL
            }))
        };

        return res.status(200).json(analyticsData);
    } catch (error) {
        console.error("Error retrieving topic analytics:", error);
        return res.status(500).json({ error: "An error occurred while retrieving topic analytics." });
    }
}

exports.getURLAnalytics_overall = async (req,res,next) => {

}