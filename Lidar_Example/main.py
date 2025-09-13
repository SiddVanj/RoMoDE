import os
import numpy as np
import open3d as o3d
import time
from glob import glob
import random

def load_velodyne_points(bin_file):
    """Load and parse KITTI velodyne binary file"""
    points = np.fromfile(bin_file, dtype=np.float32).reshape(-1, 4)
    return points

def create_lidar_pcd(points, clean_mode=True):
    """Convert numpy points to Open3D point cloud with quality simulation"""
    pcd = o3d.geometry.PointCloud()
    
    if clean_mode:
        # Clean dataset: proper preprocessing, consistent data
        pcd.points = o3d.utility.Vector3dVector(points[:, :3])
        colors = np.zeros((points.shape[0], 3))
        max_int = np.max(points[:, 3]) if points.shape[0] and np.max(points[:, 3]) > 0 else 1.0
        colors[:, 0] = points[:, 3] / max_int  # Consistent intensity mapping
        pcd.colors = o3d.utility.Vector3dVector(colors)
    
    
    return pcd

class ModeHandler:
    """Handle clean/unclean mode toggling"""
    def __init__(self):
        self.clean_mode = False
        self.space_pressed = False
        
    def toggle_mode(self):
        """Toggle between clean and unclean mode"""
        if not self.space_pressed:
            self.clean_mode = not self.clean_mode
            mode_str = "CLEAN" if self.clean_mode else "UNCLEAN"
            print(f"\n[TOGGLE] Switched to {mode_str} dataset mode")
            self.space_pressed = True
            return True
        return False

def visualize_comparison(fps=5, switch_interval=10):
    """Compare clean vs unclean dataset visualization - LiDAR only"""
    # Setup paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    lidar_pattern = os.path.join(base_dir, 'velodyne_points/data/*.bin')
    
    lidar_files = sorted(glob(lidar_pattern))
    
    if not lidar_files:
        print("Error: No LiDAR files found!")
        return

    print(f"Dataset Quality Comparison Demo - LiDAR Only")
    print(f"Found {len(lidar_files)} LiDAR files")
    print(f"Controls: SPACE = toggle mode, ESC = quit (in 3D window)")
    print(f"Auto-switches every {switch_interval} seconds")

    # Create mode handler
    mode_handler = ModeHandler()

    # Create Open3D visualizer with key callback (NO OpenCV window needed)
    vis = o3d.visualization.VisualizerWithKeyCallback()
    vis.create_window("LiDAR Quality Comparison - Press SPACE to toggle", width=1000, height=700)
    
    # Register space bar callback for Open3D window
    def space_callback(vis):
        mode_handler.toggle_mode()
        return False
    
    vis.register_key_callback(32, space_callback)  # Space bar key code
    
    # Set view control
    view_control = vis.get_view_control()
    view_control.set_zoom(0.1)
    view_control.set_front([0, 0, -1])
    view_control.set_lookat([0, 0, 0])
    view_control.set_up([0, -1, 0])
    
    # Main loop variables
    frame_idx = 0
    running = True
    frame_delay = 1.0 / float(fps)
    last_advance = time.perf_counter()
    last_mode_switch = time.perf_counter()
    
    print("Starting visualization...")
    print("Press SPACE in the 3D window to toggle between Clean/Unclean modes")
    
    while running:
        current_time = time.perf_counter()
        
        # Auto-switch mode every switch_interval seconds (optional)
        # if current_time - last_mode_switch >= switch_interval:
        #     mode_handler.clean_mode = not mode_handler.clean_mode
        #     last_mode_switch = current_time
        #     mode_str = "CLEAN" if mode_handler.clean_mode else "UNCLEAN"
        #     print(f"\nAuto-switched to {mode_str} dataset mode")
        
        # Load and process LiDAR data
        points = load_velodyne_points(lidar_files[frame_idx])
        pcd = create_lidar_pcd(points, mode_handler.clean_mode)
        
        # Clear and update LiDAR visualization
        vis.clear_geometries()
        vis.add_geometry(pcd)
        
        # Add coordinate frame
        coord_frame = o3d.geometry.TriangleMesh.create_coordinate_frame(size=5.0)
        vis.add_geometry(coord_frame)
        
        # Update Open3D window
        try:
            if not vis.poll_events():
                running = False
                break
            vis.update_renderer()
        except:
            pass
        
        # Reset space pressed flag
        if mode_handler.space_pressed:
            mode_handler.space_pressed = False
        
        # Print status to console
        mode_str = "CLEAN" if mode_handler.clean_mode else "UNCLEAN"
        time_remaining = switch_interval - (current_time - last_mode_switch)
        
        # Show data quality characteristics in console
        if mode_handler.clean_mode:
            quality_info = "✓ Consistent density, proper intensity, no missing data"
        else:
            quality_info = "✗ Missing points (15%), noise, outliers"
        
        status = f"Frame {frame_idx + 1}/{len(lidar_files)} | Mode: {mode_str} | Points: {len(points)} | {quality_info} | Auto-switch: {time_remaining:.1f}s"
        print(f"\r{status}", end="", flush=True)
        
        # Auto-advance frames
        if current_time - last_advance >= frame_delay:
            frame_idx = (frame_idx + 1) % len(lidar_files)
            last_advance = current_time
    
    # Cleanup
    vis.destroy_window()

if __name__ == "__main__":
    print("Dataset Quality Comparison Demo - LiDAR Only")
    print("Controls:")
    print("  'SPACE': Toggle between clean/unclean modes")
    print("  'ESC': Quit (or close window)")
    print("Auto-switches every 10 seconds")
    visualize_comparison(fps=8, switch_interval=10)
    print("Done.")