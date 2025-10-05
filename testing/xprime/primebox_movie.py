import requests

params = {
    "name": "How to Train Your Dragon",
    "year": "2025",
    "fallback_year": "2025", 
}
r = requests.get("https://backend.xprime.tv/primebox", params=params) # no proxy is needed for this request

# response format:
'''
{
    "available_qualities": [
        "1080P",
        "480P",
        "360P"
    ],
    "has_subtitles": true,
    "status": "ok",
    "streams": {
        "1080P": "https://oca.flutch09.workers.dev/?v=Yo7qmdX06Me9TemNNVSTBLLX74j7Azy1a2axIDZXt%2F3rpPpzSl62vdd7aXMN3kO%2BxFbYNlSsiT38dDAZTAvPA18PYLKteUDnlWN5t7RT65GOiUh7UnFPuG8liWKET1hW2mUOY%2FI%2BGuCQbJI%2FI676HB1BmfjwAIr8FL7azUsn%2Bo1APVO9qLA6W0VEMGO8t4V452%2F5%2BjcH2aeyXHoy6Rsz66rOmbdB0wXChMCom5I%3D&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe",
        "360P": "https://oca.flutch09.workers.dev/?v=AlqP9n2SkL8ktwm5kD0W8uI6Fp4ZBE3w4eL3q5g0Fnt9m%2BO8mZl3tGnwtkfrC80kpdm6eMS49H6RxOyZb5Abp9%2FQosL3LwH70n1wguvwHMBqrUpU7Rl1t2le2kJRNyxYcVLaRJuYZRWeWiPwRhBXicuATj%2FSpCsSY63NiovBUtaoaCazWfNvscpNKyTuqcI19crCzLsx179KRyie4Uwc3TuzH4IB2w%3D%3D&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe",
        "480P": "https://oca.flutch09.workers.dev/?v=zP%2B%2FV%2Bsrh45H9Em3vorGeS9X4S2A5qjNQ2ualw6mhQi6yLSQZ%2FbYbjxwdC9egDRDku9HuyiKcUPsZJqAz4VwT0bzyvMDaQo%2Fh4W964pyX2Lvv08z0D0CQ1iRTWbOVLz3qoKLYcI5MvAoB7J7%2Bp2hl48LXn7YxE1RADCw1MKjOr1Zf308K7VzWZ%2FUQEGyzQYhhN7ErCMb3ojmHRATit%2B0nFW3dUhkLleI9O5G%2BLU%3D&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe"
    },
    "subtitles": [
        {
            "file": "https://forwarder.kendrickl-3amar.site/?url=9JkVRZNaZwqohi7KZDZAumwUmaaYDt1NSt4BbLIIrDLs%2BXf328vq3%2Fo%2B%2FIcFamshZbfwJG9Uv0T9d%2FYtXyuE5OpOJtbj%2FZIOHHX9ZeGhE8Q3KUOpU4bJPbmo843udiV42TSzVVb8IjoxepE%2Bx9PqOo9SbzsKPkQ8x7A6eQmTXWl0qOxLpyjwbuCGyF870XjDGPDfz8%2FWbfP4msaMzwz2kc983rNuWBpF%2FILMbKLwuSWo6PlKQp3gdAzOW0xw0ylXp2eakx0DLLCdjCPXutIZD4zOBuQAjGeePSsUyAjNeyZhrrDZ%2B%2FETXOR4bKOTZn6Akh6rcmAHGbwAGEDFFmcIUtgyGC%2BzPs0xVqpe4vsqYRCP08YIe06ogt%2BR5OtinWRiuYXBZ4KCPn2TgeafQ%2F4jagXuGIsbRyHbLtH4mP9swEY6d987l9T2q9bqQQXQLYD5kqI8Ta8yOZANBsrN6B7IBkM36iDwMldU%2BcYcy5dJb0bX0ixXaqxhBqAmBMH0yipRGCQY3xeTrFf0e%2Fut9GWtEcb7J2bevluJL4EEyw6dsG%2BHIRcQ57LQqE4x%2B7BY3RfBCJmt82VXDySwEPMbhHT4Dwu2%2BNQQnopUJArmduFiko2I4i%2BQLKiW0bEjvMxGMQl56q2eLXK4rK%2BtxcIJmyevoAmg4K%2BlzWfZgMcdL%2F%2Fh7Tf9%2BVkddSGxOAbcZq6RGRkOBbZDPgJG4RnppfRtCFy%2Bc8d90jIRT0Ml5%2BXEsa9bN8Hvz1roKQn%2FLfYfa2UaPmZ9%2BS6wcEmfG8GAqshDaG%2FPCVAgo2yxpw5veS%2B4%2FBtLDZRzANJPxUamDEMAwoiK7CEKZqze9trnN1NL2yVAM8hlAo95hWxG6JHM%2FM%2BdQ0%2FDMFUzM6BvWY40BzfSs3xPXg%3D%3D&headers=%7B%22origin%22%3A%22https%3A%2F%2Fmoviebox.ng%22%2C%22referer%22%3A%22https%3A%2F%2Fmoviebox.ng%22%7D&safe&normal=",
            "label": "اَلْعَرَبِيَّةُ"
        }, ...
    ],
    "title": "How to Train Your Dragon"
}
'''

# the m3u8 proxy must be used for the streams with the referer being https://pstream.mov

print(r.text)
